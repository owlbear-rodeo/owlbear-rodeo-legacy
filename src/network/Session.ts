import io, { Socket } from "socket.io-client";
// import msgParser from "socket.io-msgpack-parser";
import { EventEmitter } from "events";

import Connection, { DataProgressEvent } from "./Connection";

import { omit } from "../helpers/shared";
import { logError } from "../helpers/logging";
import { SignalData } from "simple-peer";

/**
 * @property {string} id - The socket id of the peer
 * @property {Connection} connection - The actual peer connection
 * @property {boolean} initiator - Is this peer the initiator of the connection
 * @property {boolean} ready - Ready for data to be sent
 */
export type SessionPeer = {
  id: string;
  connection: Connection;
  initiator: boolean;
  ready: boolean;
};

export type PeerData = any;

export type PeerReply = (id: string, data: PeerData, chunkId?: string) => void;

/**
 *
 * Handles connections to multiple peers
 */
class Session extends EventEmitter {
  /**
   * The socket io connection
   */
  socket?: Socket;

  /**
   * A mapping of socket ids to session peers
   *
   * @type {Object.<string, SessionPeer>}
   */
  peers: Record<string, SessionPeer>;

  get id() {
    return this.socket?.id;
  }

  _iceServers: RTCIceServer[] = [];

  // Store party id and password for reconnect
  _gameId: string = "";
  _password: string = "";

  constructor() {
    super();
    this.peers = {};
    // Signal connected peers of a closure on refresh
    window.addEventListener("beforeunload", this._handleUnload.bind(this));
  }

  /**
   * Connect to the websocket
   */
  async connect() {
    try {
      if (
        !process.env.REACT_APP_ICE_SERVERS_URL ||
        process.env.REACT_APP_MAINTENANCE === "true"
      ) {
        this.emit("status", "offline");
        return;
      }
      this.socket = io(process.env.REACT_APP_BROKER_URL!, {
        withCredentials: true,
        // parser: msgParser,
        transports: ["websocket"],
        query: {
          "room": "13.250.60.135:7658"
        }
      });
      const response = await fetch(process.env.REACT_APP_ICE_SERVERS_URL, {
        headers: {
          "x-envoy-original-dst-host": "13.250.60.135:7658"
        }
      });
      if (!response.ok) {
        throw Error("Unable to fetch ICE servers");
      }
      const data = await response.json();
      this._iceServers = data.iceServers;

      this.socket.on("player_joined", this._handlePlayerJoined.bind(this));
      this.socket.on("player_left", this._handlePlayerLeft.bind(this));
      this.socket.on("joined_game", this._handleJoinedGame.bind(this));
      this.socket.on("signal", this._handleSignal.bind(this));
      this.socket.on("auth_error", this._handleAuthError.bind(this));
      this.socket.on("game_expired", this._handleGameExpired.bind(this));
      this.socket.on("disconnect", this._handleSocketDisconnect.bind(this));
      this.socket.io.on("reconnect", this._handleSocketReconnect.bind(this));
      this.socket.on("force_update", this._handleForceUpdate.bind(this));

      this.emit("status", "ready");
    } catch (error: any) {
      logError(error);
      this.emit("status", "offline");
    }
  }

  disconnect() {
    this.socket?.disconnect();
  }

  /**
   * Send data to a single peer
   *
   * @param sessionId - The socket id of the player to send to
   * @param eventId - The id of the event to send
   */
  sendTo(sessionId: string, eventId: string, data: PeerData, chunkId?: string) {
    if (!(sessionId in this.peers)) {
      if (!this._addPeer(sessionId, true)) {
        return;
      }
    }

    if (!this.peers[sessionId].ready) {
      this.peers[sessionId].connection.once("connect", () => {
        this.peers[sessionId].connection.sendObject(
          { id: eventId, data },
          chunkId
        );
      });
    } else {
      this.peers[sessionId].connection.sendObject(
        { id: eventId, data },
        chunkId
      );
    }
  }

  /**
   * Start streaming to a peer
   *
   * @param {string} sessionId - The socket id of the player to stream to
   * @param {MediaStreamTrack} track
   * @param {MediaStream} stream
   */
  startStreamTo(
    sessionId: string,
    track: MediaStreamTrack,
    stream: MediaStream
  ) {
    if (!(sessionId in this.peers)) {
      if (!this._addPeer(sessionId, true)) {
        return;
      }
    }

    if (!this.peers[sessionId].ready) {
      this.peers[sessionId].connection.once("connect", () => {
        this.peers[sessionId].connection.addTrack(track, stream);
      });
    } else {
      this.peers[sessionId].connection.addTrack(track, stream);
    }
  }

  /**
   * End streaming to a peer
   *
   * @param {string} sessionId - The socket id of the player to stream to
   * @param {MediaStreamTrack} track
   * @param {MediaStream} stream
   */
  endStreamTo(sessionId: string, track: MediaStreamTrack, stream: MediaStream) {
    if (sessionId in this.peers) {
      this.peers[sessionId].connection.removeTrack(track, stream);
    }
  }

  /**
   * Join a party
   *
   * @param {string} gameId - the id of the party to join
   * @param {string} password - the password of the party
   */
  async joinGame(gameId: string, password: string) {
    if (typeof gameId !== "string" || typeof password !== "string") {
      console.error(
        "Unable to join game: invalid game ID or password",
        gameId,
        password
      );
      return;
    }

    this._gameId = gameId;
    this._password = password;
    this.socket?.emit(
      "join_game",
      gameId,
      password,
      process.env.REACT_APP_VERSION
    );
    this.emit("status", "joining");
  }

  /**
   * Add a new peer connection
   * @param {string} id
   * @param {boolean} initiator
   * @returns {boolean} True if peer was added successfully
   */
  _addPeer(id: string, initiator: boolean): boolean {
    try {
      const connection = new Connection({
        initiator,
        trickle: true,
        config: { iceServers: this._iceServers },
      });

      // Up max listeners to 100 to account for up to 100 tokens on load
      connection.setMaxListeners && connection.setMaxListeners(100);

      const peer = { id, connection, initiator, ready: false };

      const reply: PeerReply = (id, data, chunkId) => {
        peer.connection.sendObject({ id, data }, chunkId);
      };

      const handleSignal = (signal: SignalData) => {
        this.socket?.emit("signal", JSON.stringify({ to: peer.id, signal }));
      };

      const handleConnect = () => {
        if (peer.id in this.peers) {
          this.peers[peer.id].ready = true;
        }
        const peerConnectEvent: PeerConnectEvent = {
          peer,
          reply,
        };
        this.emit("peerConnect", peerConnectEvent);
      };

      const handleDataComplete = (data: any) => {
        const peerDataEvent: PeerDataEvent = {
          peer,
          id: data.id,
          data: data.data,
          reply: reply,
        };
        this.emit("peerData", peerDataEvent);
      };

      const handleDataProgress = ({ id, count, total }: DataProgressEvent) => {
        const peerDataProgressEvent: PeerDataProgressEvent = {
          peer,
          id,
          count,
          total,
          reply,
        };

        this.emit("peerDataProgress", peerDataProgressEvent);
      };

      const handleTrack = (track: MediaStreamTrack, stream: MediaStream) => {
        const peerTrackAddedEvent: PeerTrackAddedEvent = {
          peer,
          track,
          stream,
        };
        this.emit("peerTrackAdded", peerTrackAddedEvent);
        track.addEventListener("mute", () => {
          const peerTrackRemovedEvent: PeerTrackRemovedEvent = {
            peer,
            track,
            stream,
          };
          this.emit("peerTrackRemoved", peerTrackRemovedEvent);
        });
      };

      const handleClose = () => {
        const peerDisconnectEvent: PeerDisconnectEvent = { peer };
        this.emit("peerDisconnect", peerDisconnectEvent);
        if (peer.id in this.peers) {
          peer.connection.destroy();
          this.peers = omit(this.peers, [peer.id]);
        }
      };

      const handleError = (error: PeerError) => {
        const peerErrorEvent: PeerErrorEvent = {
          peer,
          error,
        };
        this.emit("peerError", peerErrorEvent);
        if (peer.id in this.peers) {
          peer.connection.destroy();
          this.peers = omit(this.peers, [peer.id]);
        }
      };

      peer.connection.on("signal", handleSignal.bind(this));
      peer.connection.on("connect", handleConnect.bind(this));
      peer.connection.on("dataComplete", handleDataComplete.bind(this));
      peer.connection.on("dataProgress", handleDataProgress.bind(this));
      peer.connection.on("track", handleTrack.bind(this));
      peer.connection.on("close", handleClose.bind(this));
      peer.connection.on("error", handleError.bind(this));

      this.peers[id] = peer;

      return true;
    } catch (error: any) {
      logError(error);
      this.emit("peerError", { error });
      for (let peer of Object.values(this.peers)) {
        peer.connection && peer.connection.destroy();
      }
      return false;
    }
  }

  _handleJoinedGame() {
    this.emit("status", "joined");
  }

  _handleGameExpired() {
    this.emit("gameExpired");
  }

  _handlePlayerJoined(id: string) {
    this.emit("playerJoined", id);
  }

  _handlePlayerLeft(id: string) {
    this.emit("playerLeft", id);
    if (id in this.peers) {
      this.peers[id].connection.destroy();
      delete this.peers[id];
    }
  }

  _handleSignal(data: { from: string; signal: SignalData }) {
    const { from, signal } = data;
    if (!(from in this.peers)) {
      if (!this._addPeer(from, false)) {
        return;
      }
    }
    this.peers[from].connection.signal(signal);
  }

  _handleAuthError() {
    this.emit("status", "auth");
  }

  _handleUnload() {
    for (let peer of Object.values(this.peers)) {
      peer.connection && peer.connection.destroy();
    }
  }

  _handleSocketDisconnect() {
    this.emit("status", "reconnecting");
    for (let peer of Object.values(this.peers)) {
      peer.connection && peer.connection.destroy();
    }
  }

  _handleSocketReconnect() {
    if (this.socket) this.socket.sendBuffer = [];
    if (this._gameId) {
      this.joinGame(this._gameId, this._password);
    }
  }

  _handleForceUpdate() {
    this.socket?.disconnect();
    this.emit("status", "needs_update");
  }
}

export type PeerConnectEvent = {
  peer: SessionPeer;
  reply: PeerReply;
};
export type PeerConnectEventHandler = (event: PeerConnectEvent) => void;

export type PeerDataEvent = {
  peer: SessionPeer;
  id: string;
  data: PeerData;
  reply: PeerReply;
};
export type PeerDataEventHandler = (event: PeerDataEvent) => void;

export type PeerDataProgressEvent = {
  peer: SessionPeer;
  id: string;
  count: number;
  total: number;
  reply: PeerReply;
};
export type PeerDataProgressEventHandler = (
  event: PeerDataProgressEvent
) => void;

export type PeerTrackAddedEvent = {
  peer: SessionPeer;
  track: MediaStreamTrack;
  stream: MediaStream;
};
export type PeerTrackAddedEventHandler = (event: PeerTrackAddedEvent) => void;

export type PeerTrackRemovedEvent = {
  peer: SessionPeer;
  track: MediaStreamTrack;
  stream: MediaStream;
};
export type PeerTrackRemovedEventHandler = (
  event: PeerTrackRemovedEvent
) => void;

export type PeerDisconnectEvent = { peer: SessionPeer };
export type PeerDisconnectEventHandler = (event: PeerDisconnectEvent) => void;

export type PeerError = Error & { code: string };
export type PeerErrorEvent = { peer: SessionPeer; error: PeerError };
export type PeerErrorEventHandler = (event: PeerErrorEvent) => void;

export type SessionStatus =
  | "ready"
  | "joining"
  | "joined"
  | "offline"
  | "reconnecting"
  | "auth"
  | "needs_update";
export type SessionStatusHandler = (status: SessionStatus) => void;

export type PlayerJoinedHandler = (id: string) => void;
export type PlayerLeftHandler = (id: string) => void;
export type GameExpiredHandler = () => void;

declare interface Session {
  /** Peer Connect Event - A peer has connected */
  on(event: "peerConnect", listener: PeerConnectEventHandler): this;
  /** Peer Data Event - Data received by a peer */
  on(event: "peerData", listener: PeerDataEventHandler): this;
  /** Peer Data Progress Event - Part of some data received by a peer */
  on(event: "peerDataProgress", listener: PeerDataProgressEventHandler): this;
  /** Peer Track Added Event - A `MediaStreamTrack` was added by a peer */
  on(event: "peerTrackAdded", listener: PeerTrackAddedEventHandler): this;
  /** Peer Track Removed Event - A `MediaStreamTrack` was removed by a peer */
  on(event: "peerTrackRemoved", listener: PeerTrackRemovedEventHandler): this;
  /** Peer Disconnect Event - A peer has disconnected */
  on(event: "peerDisconnect", listener: PeerDisconnectEventHandler): this;
  /** Peer Error Event - An error occured with a peer connection */
  on(event: "peerError", listener: PeerErrorEventHandler): this;
  /** Session Status Event - Status of the session has changed */
  on(event: "status", listener: SessionStatusHandler): this;
  /** Player Joined Event - A player has joined the game */
  on(event: "playerJoined", listener: PlayerJoinedHandler): this;
  /** Player Left Event - A player has left the game */
  on(event: "playerLeft", listener: PlayerLeftHandler): this;
  /** Game Expired Event - A joining game has expired */
  on(event: "gameExpired", listener: GameExpiredHandler): this;
}

export default Session;

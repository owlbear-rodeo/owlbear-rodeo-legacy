import io, { Socket } from "socket.io-client";
import msgParser from "socket.io-msgpack-parser";
import { EventEmitter } from "events";

import Connection from "./Connection";

import { omit } from "../helpers/shared";
import { logError } from "../helpers/logging";
import { SimplePeerData } from "simple-peer";

/**
 * @typedef {object} SessionPeer
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

/**
 * @callback peerReply
 * @param {string} id - The id of the event
 * @param {object} data - The data to send
 * @param {string=} channel - The channel to send to
 * @param {string=} chunkId
 */

type peerReply = (id: string, data: SimplePeerData, channel: string) => void;

/**
 * Session Status Event - Status of the session has changed
 *
 * @event Session#status
 * @property {"ready"|"joining"|"joined"|"offline"|"reconnecting"|"auth"|"needs_update"} status
 */

/**
 *
 * Handles connections to multiple peers
 *
 * @fires Session#peerConnect
 * @fires Session#peerData
 * @fires Session#peerTrackAdded
 * @fires Session#peerTrackRemoved
 * @fires Session#peerDisconnect
 * @fires Session#peerError
 * @fires Session#status
 * @fires Session#playerJoined
 * @fires Session#playerLeft
 * @fires Session#gameExpired
 */
class Session extends EventEmitter {
  /**
   * The socket io connection
   *
   * @type {io.Socket}
   */
  socket: Socket = io();

  /**
   * A mapping of socket ids to session peers
   *
   * @type {Object.<string, SessionPeer>}
   */
  peers: Record<string, SessionPeer>;

  get id() {
    return this.socket && this.socket.id;
  }

  _iceServers: string[] = [];

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
      if (!process.env.REACT_APP_ICE_SERVERS_URL) {
        return;
      }
      const response = await fetch(process.env.REACT_APP_ICE_SERVERS_URL);
      if (!response.ok) {
        throw Error("Unable to fetch ICE servers");
      }
      const data = await response.json();
      this._iceServers = data.iceServers;

      if (!process.env.REACT_APP_BROKER_URL) {
        return;
      }
      this.socket = io(process.env.REACT_APP_BROKER_URL, {
        withCredentials: true,
        parser: msgParser,
      });

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
    } catch (error) {
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
   * @param {string} sessionId - The socket id of the player to send to
   * @param {string} eventId - The id of the event to send
   * @param {object} data
   * @param {string=} channel
   * @param {string=} chunkId
   */
  sendTo(sessionId: string, eventId: string, data: any, channel?: string, chunkId?: string) {
    if (!(sessionId in this.peers)) {
      if (!this._addPeer(sessionId, true)) {
        return;
      }
    }

    if (!this.peers[sessionId].ready) {
      this.peers[sessionId].connection.once("connect", () => {
        this.peers[sessionId].connection.sendObject(
          { id: eventId, data },
          channel,
          chunkId
        );
      });
    } else {
      this.peers[sessionId].connection.sendObject(
        { id: eventId, data },
        channel
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
    this.socket.emit(
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
  _addPeer(id: string, initiator: boolean) {
    try {
      const connection = new Connection({
        initiator,
        trickle: true,
        config: { iceServers: this._iceServers },
      });

      // Up max listeners to 100 to account for up to 100 tokens on load
      connection.setMaxListeners && connection.setMaxListeners(100);

      const peer = { id, connection, initiator, ready: false };

      function reply(id: string, data: any, channel?: string, chunkId?: string) {
        peer.connection.sendObject({ id, data }, channel, chunkId);
      }

      const handleSignal = (signal: any) => {
        this.socket.emit("signal", JSON.stringify({ to: peer.id, signal }));
      };

      const handleConnect = () => {
        if (peer.id in this.peers) {
          this.peers[peer.id].ready = true;
        }
        /**
         * Peer Connect Event - A peer has connected
         *
         * @event Session#peerConnect
         * @type {object}
         * @property {SessionPeer} peer
         * @property {peerReply} reply
         */
        this.emit("peerConnect", { peer, reply });
      }

      const handleDataComplete = (data: any) => {
        /**
         * Peer Data Event - Data received by a peer
         *
         * @event Session#peerData
         * @type {object}
         * @property {SessionPeer} peer
         * @property {string} id
         * @property {object} data
         * @property {peerReply} reply
         */
        let peerDataEvent: {
          peer: SessionPeer;
          id: string;
          data: any;
          reply: peerReply;
        } = {
          peer,
          id: data.id,
          data: data.data,
          reply: reply,
        };
        console.log(`Data: ${JSON.stringify(data)}`)
        this.emit("peerData", peerDataEvent);
      };

      const handleDataProgress = ({
        id,
        count,
        total,
      }: {
        id: string;
        count: number;
        total: number;
      }) => {
        this.emit("peerDataProgress", {
          peer,
          id,
          count,
          total,
          reply,
        });
      };

      const handleTrack = (track: MediaStreamTrack, stream: MediaStream) => {
        /**
         * Peer Track Added Event - A `MediaStreamTrack` was added by a peer
         *
         * @event Session#peerTrackAdded
         * @type {object}
         * @property {SessionPeer} peer
         * @property {MediaStreamTrack} track
         * @property {MediaStream} stream
         */
        let peerTrackAddedEvent: {
          peer: SessionPeer;
          track: MediaStreamTrack;
          stream: MediaStream;
        } = { peer, track, stream };
        this.emit("peerTrackAdded", peerTrackAddedEvent);
        track.addEventListener("mute", () => {
          /**
           * Peer Track Removed Event - A `MediaStreamTrack` was removed by a peer
           *
           * @event Session#peerTrackRemoved
           * @type {object}
           * @property {SessionPeer} peer
           * @property {MediaStreamTrack} track
           * @property {MediaStream} stream
           */
          let peerTrackRemovedEvent: {
            peer: SessionPeer;
            track: MediaStreamTrack;
            stream: MediaStream;
          } = { peer, track, stream };
          this.emit("peerTrackRemoved", peerTrackRemovedEvent);
        });
      };

      const handleClose = () => {
        /**
         * Peer Disconnect Event - A peer has disconnected
         *
         * @event Session#peerDisconnect
         * @type {object}
         * @property {SessionPeer} peer
         */
        let peerDisconnectEvent: { peer: SessionPeer } = { peer };
        this.emit("peerDisconnect", peerDisconnectEvent);
        if (peer.id in this.peers) {
          peer.connection.destroy();
          this.peers = omit(this.peers, [peer.id]);
        }
      };

      const handleError = (error: Error) => {
        /**
         * Peer Error Event - An error occured with a peer connection
         *
         * @event Session#peerError
         * @type {object}
         * @property {SessionPeer} peer
         * @property {Error} error
         */
        let peerErrorEvent: { peer: SessionPeer; error: Error } = {
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
    } catch (error) {
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
    /**
     * Game Expired Event - A joining game has expired
     *
     * @event Session#gameExpired
     */
    this.emit("gameExpired");
  }

  _handlePlayerJoined(id: string) {
    /**
     * Player Joined Event - A player has joined the game
     *
     * @event Session#playerJoined
     * @property {string} id
     */
    this.emit("playerJoined", id);
  }

  _handlePlayerLeft(id: string) {
    /**
     * Player Left Event - A player has left the game
     *
     * @event Session#playerLeft
     * @property {string} id
     */
    this.emit("playerLeft", id);
    if (id in this.peers) {
      this.peers[id].connection.destroy();
      delete this.peers[id];
    }
  }

  _handleSignal(data: any) {
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
    if (this._gameId) {
      this.joinGame(this._gameId, this._password);
    }
  }

  _handleForceUpdate() {
    /**
     * Force Update Event - An update has been released
     *
     * @event Session#forceUpdate
     */
    this.socket.disconnect();
    this.emit("status", "needs_update");
  }
}

export default Session;

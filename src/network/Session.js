import io from "socket.io-client";
import { EventEmitter } from "events";

import Connection from "./Connection";

import { omit } from "../helpers/shared";
import { logError } from "../helpers/logging";

/**
 * @typedef {object} SessionPeer
 * @property {string} id - The socket id of the peer
 * @property {Connection} connection - The actual peer connection
 * @property {boolean} initiator - Is this peer the initiator of the connection
 */

/**
 * @callback peerReply
 * @param {string} id - The id of the event
 * @param {object} data - The data to send
 * @param {string} channel - The channel to send to
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
 * @fires Session#authenticationSuccess
 * @fires Session#authenticationError
 * @fires Session#connected
 * @fires Session#disconnected
 * @fires Session#playerJoined
 * @fires Session#playerLeft
 */
class Session extends EventEmitter {
  /**
   * The socket io connection
   *
   * @type {SocketIOClient.Socket}
   */
  socket;

  /**
   * A mapping of socket ids to session peers
   *
   * @type {Object.<string, SessionPeer>}
   */
  peers;

  /**
   * The state of the session
   *
   * @type {('unknown'|'online'|'offline')}
   */
  state;

  get id() {
    return this.socket && this.socket.id;
  }

  _iceServers;

  // Store party id and password for reconnect
  _gameId;
  _password;

  constructor() {
    super();
    this.peers = {};
    this.state = "unknown";
    // Signal connected peers of a closure on refresh
    window.addEventListener("beforeunload", this._handleUnload.bind(this));
  }

  /**
   * Connect to the websocket
   */
  async connect() {
    try {
      const response = await fetch(process.env.REACT_APP_ICE_SERVERS_URL);
      if (!response.ok) {
        throw Error("Unable to fetch ICE servers");
      }
      const data = await response.json();
      this._iceServers = data.iceServers;

      this.socket = io(process.env.REACT_APP_BROKER_URL, {
        withCredentials: true,
      });

      this.socket.on("player_joined", this._handlePlayerJoined.bind(this));
      this.socket.on("player_left", this._handlePlayerLeft.bind(this));
      this.socket.on("joined_game", this._handleJoinedGame.bind(this));
      this.socket.on("signal", this._handleSignal.bind(this));
      this.socket.on("auth_error", this._handleAuthError.bind(this));
      this.socket.on("disconnect", this._handleSocketDisconnect.bind(this));
      this.socket.io.on("reconnect", this._handleSocketReconnect.bind(this));

      this.state = "online";
    } catch (error) {
      logError(error);
      this.state = "offline";
    }
  }

  /**
   * Send data to all connected peers
   *
   * @param {string} id - the id of the event to send
   * @param {object} data
   * @param {string} channel
   */
  send(id, data, channel) {
    for (let peer of Object.values(this.peers)) {
      peer.connection.send({ id, data }, channel);
    }
  }

  /**
   * Send data to a single peer
   *
   * @param {string} sessionId - the socket id of the player to send to
   * @param {string} eventId - the id of the event to send
   * @param {object} data
   * @param {string} channel
   */
  sendTo(sessionId, eventId, data, channel) {
    if (!(sessionId in this.peers)) {
      this._addPeer(sessionId, true);
      this.peers[sessionId].connection.once("connect", () => {
        this.peers[sessionId].connection.send({ id: eventId, data }, channel);
      });
    } else {
      this.peers[sessionId].connection.send({ id: eventId, data }, channel);
    }
  }

  /**
   * Join a party
   *
   * @param {string} gameId - the id of the party to join
   * @param {string} password - the password of the party
   */
  async joinGame(gameId, password) {
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
    this.socket.emit("join_game", gameId, password);
  }

  _addPeer(id, initiator) {
    try {
      const connection = new Connection({
        initiator,
        trickle: true,
        config: { iceServers: this._iceServers },
      });
      if (initiator) {
        connection.createDataChannel("map", { iceServers: this._iceServers });
        connection.createDataChannel("token", { iceServers: this._iceServers });
      }
      const peer = { id, connection, initiator };

      function sendPeer(id, data, channel) {
        peer.connection.send({ id, data }, channel);
      }

      function handleSignal(signal) {
        this.socket.emit("signal", JSON.stringify({ to: peer.id, signal }));
      }

      function handleConnect() {
        /**
         * Peer Connect Event - A peer has connected
         *
         * @event Session#peerConnect
         * @type {object}
         * @property {SessionPeer} peer
         * @property {peerReply} reply
         */
        this.emit("peerConnect", { peer, reply: sendPeer });
      }

      function handleDataComplete(data) {
        if (data.id === "close") {
          // Close connection when signaled to close
          peer.connection.destroy();
        }
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
        this.emit("peerData", {
          peer,
          id: data.id,
          data: data.data,
          reply: sendPeer,
        });
      }

      function handleDataProgress({ id, count, total }) {
        this.emit("dataProgress", { peer, id, count, total, reply: sendPeer });
      }

      function handleTrack(track, stream) {
        /**
         * Peer Track Added Event - A `MediaStreamTrack` was added by a peer
         *
         * @event Session#peerTrackAdded
         * @type {object}
         * @property {SessionPeer} peer
         * @property {MediaStreamTrack} track
         * @property {MediaStream} stream
         */
        this.emit("peerTrackAdded", { peer, track, stream });
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
          this.emit("peerTrackRemoved", { peer, track, stream });
        });
      }

      function handleClose() {
        /**
         * Peer Disconnect Event - A peer has disconnected
         *
         * @event Session#peerDisconnect
         * @type {object}
         * @property {SessionPeer} peer
         */
        this.emit("peerDisconnect", { peer });
        if (peer.id in this.peers) {
          peer.connection.destroy();
          this.peers = omit(this.peers, [peer.id]);
        }
      }

      function handleError(error) {
        console.error(error);
        /**
         * Peer Error Event - An error occured with a peer connection
         *
         * @event Session#peerError
         * @type {object}
         * @property {SessionPeer} peer
         * @property {Error} error
         */
        this.emit("peerError", { peer, error });
        if (peer.id in this.peers) {
          peer.connection.destroy();
          this.peers = omit(this.peers, [peer.id]);
        }
      }

      peer.connection.on("signal", handleSignal.bind(this));
      peer.connection.on("connect", handleConnect.bind(this));
      peer.connection.on("dataComplete", handleDataComplete.bind(this));
      peer.connection.on("dataProgress", handleDataProgress.bind(this));
      peer.connection.on("track", handleTrack.bind(this));
      peer.connection.on("close", handleClose.bind(this));
      peer.connection.on("error", handleError.bind(this));

      this.peers[id] = peer;
    } catch (error) {
      logError(error);
      this.emit("peerError", { error });
      this.emit("disconnected");
      for (let peer of Object.values(this.peers)) {
        peer.connection && peer.connection.destroy();
      }
    }
  }

  _handleJoinedGame() {
    /**
     * Authentication Success Event - Successfully authenticated when joining a game
     *
     * @event Session#authenticationSuccess
     */
    this.emit("authenticationSuccess");
    /**
     * Connected Event - You have connected to the game
     *
     * @event Session#connected
     */
    this.emit("connected");
  }

  _handlePlayerJoined(id) {
    /**
     * Player Joined Event - A player has joined the game
     *
     * @event Session#playerJoined
     * @property {string} id
     */
    this.emit("playerJoined", id);
  }

  _handlePlayerLeft(id) {
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

  _handleSignal(data) {
    const { from, signal } = data;
    if (!(from in this.peers)) {
      this._addPeer(from, false);
    }
    this.peers[from].connection.signal(signal);
  }

  _handleAuthError() {
    /**
     * Authentication Error Event - Unsuccessfully authenticated when joining a game
     *
     * @event Session#authenticationError
     */
    this.emit("authenticationError");
  }

  _handleUnload() {
    for (let peer of Object.values(this.peers)) {
      peer.connection.send({ id: "close" });
    }
  }

  _handleSocketDisconnect() {
    /**
     * Disconnected Event - You have disconnected from the party
     *
     * @event Session#disconnected
     */
    this.emit("disconnected");
    for (let peer of Object.values(this.peers)) {
      peer.connection && peer.connection.destroy();
    }
  }

  _handleSocketReconnect() {
    if (this._gameId) {
      this.joinGame(this._gameId, this._password);
    }
  }
}

export default Session;

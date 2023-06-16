import { Server, Socket } from "socket.io";
import { applyChanges, Update } from "../helpers/diff";
import GameRepository from "./GameRepository";

export default class GameState {
  io: Server;
  socket: Socket;
  gameRepository: GameRepository;

  constructor(io: Server, socket: Socket, gameRepository: GameRepository) {
    this.io = io;
    this.socket = socket;
    this.gameRepository = gameRepository;
  }

  getGameId(): string | undefined {
    let gameId;
    // eslint-disable-next-line no-restricted-syntax
    for (const room of this.socket.rooms) {
      if (room !== this.socket.id) {
        gameId = room;
      }
    }
    return gameId;
  }

  async joinGame(gameId: string): Promise<void> {
    await this.socket.join(gameId);

    const partyState = this.gameRepository.getPartyState(gameId);
    this.socket.emit("party_state", partyState);

    const mapState = this.gameRepository.getState(gameId, "mapState");
    this.socket.emit("map_state", mapState);

    const map = this.gameRepository.getState(gameId, "map");
    this.socket.emit("map", map);

    const manifest = this.gameRepository.getState(gameId, "manifest");
    this.socket.emit("manifest", manifest);

    this.socket.to(gameId).emit("player_joined", this.socket.id);
  }

  async broadcastPlayerState(
    gameId: string,
    socket: Socket,
    eventName: string
  ): Promise<void> {
    const state = this.gameRepository.getPartyState(gameId);
    socket.broadcast.to(gameId).emit(eventName, state);
  }

  async updateState(
    gameId: string,
    field: "map" | "mapState" | "manifest",
    update: Update<any>
  ): Promise<boolean> {
    const state = this.gameRepository.getState(gameId, field) as any;
    if (state && !(state instanceof Map) && update.id === state["mapId"]) {
      applyChanges(state, update.changes);
      this.gameRepository.setState(gameId, field, state);
      return true;
    }
    return false;
  }
}

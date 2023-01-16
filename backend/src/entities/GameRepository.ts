import { PlayerState } from "../types/PlayerState";
import { PartyState } from "../types/PartyState";
import { MapState } from "../types/MapState";
import { Manifest } from "../types/Manifest";
import { Map } from "../types/Map";
import Game from "./Game";

export default class GameRepository {
  games: Record<string, Game>;

  constructor() {
    this.games = {};
  }

  setGameCreation(gameId: string, hash: string): void {
    const game = new Game(gameId, hash);

    this.games[gameId] = game;
  }

  isGameCreated(gameId: string): boolean {
    if (this.games[gameId] === undefined) {
      return false;
    }

    return true;
  }

  getPartyState(gameId: string): PartyState {
    const game = this.games[gameId];

    const result = game.getPartyState();

    return result;
  }

  getGamePasswordHash(gameId: string): string {
    const game = this.games[gameId];

    const result = game.getGamePasswordHash();

    return result;
  }

  setGamePasswordHash(gameId: string, hash: string): void {
    const game = this.games[gameId];

    game.setGamePasswordHash(hash);
  }

  setPlayerState(
    gameId: string,
    playerState: PlayerState,
    playerId: string
  ): void {
    const game = this.games[gameId];
    game.setPlayerState(playerState, playerId);
  }

  deletePlayer(gameId: string, playerId: string): void {
    const game = this.games[gameId];
    game.deletePlayer(playerId);
  }

  deleteGameData(gameId: string): void {
    const game = this.games[gameId];
    game.deleteGameData();
  }

  setState(
    gameId: string,
    field: "map" | "mapState" | "manifest",
    value: any
  ): void {
    const game = this.games[gameId];
    game.setState(field, value);
  }

  getState(
    gameId: string,
    field: "map" | "mapState" | "manifest"
  ): MapState | Manifest | Map {
    const game = this.games[gameId];
    const result = game.getState(field);
    return result;
  }
}

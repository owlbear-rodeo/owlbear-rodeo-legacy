import { PlayerState } from "../types/PlayerState";
import { PartyState } from "../types/PartyState";
import { MapState } from "../types/MapState";
import { Manifest } from "../types/Manifest";
import { Map } from "../types/Map";

export default class Game {
  gameId: string;
  partyState: PartyState;
  passwordHash: string;
  state: Record<string, MapState | Manifest | Map>;

  constructor(gameId: string, hash: string) {
    this.gameId = gameId;
    this.partyState = {};
    this.passwordHash = hash;
    this.state = {};
  }

  getPartyState(): PartyState {
    // const result = await this.redis.json_hgetall(`game:${gameId}:partyState`);
    const result = this.partyState;
    return result;
  }

  getGamePasswordHash(): string {
    // const result = await this.redis.get(`game:${gameId}:passwordHash`);

    const result = this.passwordHash;
    return result;
  }

  setGamePasswordHash(hash: string): void {
    // const result = await this.redis.set(`game:${gameId}:passwordHash`, hash);

    this.passwordHash = hash;
  }

  setPlayerState(playerState: PlayerState, playerId: string): void {
    this.partyState[playerId] = playerState;
  }

  deletePlayer(playerId: string): void {
    delete this.partyState[playerId];
  }

  deleteGameData(): void {
    this.state = {};
    this.partyState = {};
  }

  setState(field: "map" | "mapState" | "manifest", value: any): void {
    if (!value) {
      delete this.state[field];
    }

    this.state[field] = value;
  }

  getState(field: "map" | "mapState" | "manifest"): MapState | Manifest | Map {
    const result = this.state[field];

    return result;
  }
}

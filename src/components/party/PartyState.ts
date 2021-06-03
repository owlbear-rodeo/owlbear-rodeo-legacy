/**
 * @typedef {object} Timer
 * @property {number} current
 * @property {number} max
 */
export type Timer = {
  current: number,
  max: number
}

/**
 * @typedef {object} PlayerDice
 * @property {boolean} share
 * @property {[]} rolls
 */
export type PlayerDice = { share: boolean, rolls: [] } 

/**
 * @typedef {object} PlayerInfo
 * @property {string} nickname
 * @property {Timer | null} timer
 * @property {PlayerDice} dice
 * @property {string} sessionId
 * @property {string} userId
 */
export type PlayerInfo = {
  nickname: string,
  timer: Timer | null,
  dice: PlayerDice,
  sessionId: string,
  userId: string
}

/**
 * @typedef {object} PartyState
 * @property {string} player
 * @property {PlayerInfo} playerInfo
 */
export type PartyState = { [player: string]: PlayerInfo }
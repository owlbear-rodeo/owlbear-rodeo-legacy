import { Duration } from "../types/Timer";

const MILLISECONDS_IN_HOUR = 3600000;
const MILLISECONDS_IN_MINUTE = 60000;
const MILLISECONDS_IN_SECOND = 1000;

/**
 * Returns a timers duration in milliseconds
 * @param {Time} t The object with an hour, minute and second property
 */
export function getHMSDuration(t: Duration): number {
  if (!t) {
    return 0;
  }
  return (
    t.hour * MILLISECONDS_IN_HOUR +
    t.minute * MILLISECONDS_IN_MINUTE +
    t.second * MILLISECONDS_IN_SECOND
  );
}

/**
 * Returns an object with an hour, minute and second property
 * @param {number} duration The duration in milliseconds
 */
export function getDurationHMS(duration: number): Duration {
  let workingDuration = duration;
  const hour = Math.floor(workingDuration / MILLISECONDS_IN_HOUR);
  workingDuration -= hour * MILLISECONDS_IN_HOUR;
  const minute = Math.floor(workingDuration / MILLISECONDS_IN_MINUTE);
  workingDuration -= minute * MILLISECONDS_IN_MINUTE;
  const second = Math.floor(workingDuration / MILLISECONDS_IN_SECOND);

  return { hour, minute, second };
}

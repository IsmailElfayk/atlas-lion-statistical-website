/**
 * Position-aware match performance scorer.
 * Input: raw event counts from a single match.
 * Output: score in [3.0, 10.0] rounded to 1 decimal, or null if the player
 *         was not in the lineup or played under 15 minutes.
 */

const GK_POSITIONS  = new Set(['GK']);
const DEF_POSITIONS = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB']);
const MID_POSITIONS = new Set(['CDM', 'CM', 'CAM', 'LM', 'RM', 'DM', 'AM']);

/**
 * @param {object} events
 * @param {boolean} events.wasStarter
 * @param {boolean} events.wasBench
 * @param {number}  events.minutesPlayed
 * @param {number}  events.goals
 * @param {number}  events.assists
 * @param {number}  events.ownGoals
 * @param {number}  events.penGoals      — subset of goals scored from the spot
 * @param {number}  events.yellowCards
 * @param {number}  events.redCards
 * @param {string}  position             — internal enum (GK, CB, LB, …, ST)
 * @returns {number|null}
 */
function computeScore(events, position) {
  if (!events) return null;
  if (!events.wasStarter && !events.wasBench) return null;
  if ((events.minutesPlayed || 0) < 15) return null;

  const pos = (position || '').toUpperCase();
  const isGK  = GK_POSITIONS.has(pos);
  const isDef = DEF_POSITIONS.has(pos);
  const isMid = MID_POSITIONS.has(pos);

  let score = 6.0;

  const goalBonus = isGK ? 1.5 : isDef ? 1.2 : isMid ? 1.0 : 0.8;
  score += (events.goals      || 0) * goalBonus;
  score += (events.assists    || 0) * 0.5;
  score += (events.penGoals   || 0) * 0.1;
  score -= (events.yellowCards || 0) * 0.5;
  score -= (events.redCards   || 0) * 2.0;
  score -= (events.ownGoals   || 0) * 1.5;

  if ((events.minutesPlayed || 0) < 45) score -= 0.3;

  return Math.min(10.0, Math.max(3.0, Math.round(score * 10) / 10));
}

module.exports = { computeScore };

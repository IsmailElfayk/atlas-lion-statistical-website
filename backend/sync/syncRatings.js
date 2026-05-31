/**
 * syncRatings — per-player match history and performance scoring.
 *
 * Two modes, selected automatically:
 *
 *   HEURISTIC (no Redis)
 *     1 req per player — getPersonMatches() only.
 *     Stores Rating docs with dataQuality='heuristic' and score 6.0.
 *     Enough for the Best XI algorithm to produce a lineup immediately.
 *
 *   FULL (Redis configured)
 *     1 req per player + 1 getMatch() per unique match (30-min Redis cache).
 *     Extracts goals/assists/cards → computeScore() → performanceScore.
 *     First run is expensive; subsequent daily runs are nearly free (all cached).
 *
 * The mode is chosen based on whether Redis is available at call time.
 */

const fd                    = require('../services/footballDataClient');
const { computeScore }      = require('../utils/scoreComputer');
const { normalizePosition } = require('../utils/positionNormalizer');
const { getRedis }          = require('../config/redis');
const Player = require('../models/Player');
const Match  = require('../models/Match');
const Club   = require('../models/Club');
const Rating = require('../models/Rating');

const MAX_RATINGS_PER_PLAYER = 35;

// ── Event extraction from full match data ─────────────────────────────────────

function extractPlayerEvents(matchData, personId) {
  const starters = [
    ...(matchData.homeTeam?.lineup ?? []).map(p => ({ ...p, isStarter: true })),
    ...(matchData.awayTeam?.lineup ?? []).map(p => ({ ...p, isStarter: true })),
  ];
  const bench = [
    ...(matchData.homeTeam?.bench ?? []).map(p => ({ ...p, isStarter: false })),
    ...(matchData.awayTeam?.bench ?? []).map(p => ({ ...p, isStarter: false })),
  ];
  const entry = [...starters, ...bench].find(p => p.id === personId);
  if (!entry) return null;

  const wasStarter = entry.isStarter;
  let wasBench = false, minutesPlayed = 0;

  if (wasStarter) {
    const off = (matchData.substitutions ?? []).find(s => s.playerOut?.id === personId);
    minutesPlayed = off ? (off.minute || 90) : 90;
  } else {
    const on = (matchData.substitutions ?? []).find(s => s.playerIn?.id === personId);
    if (on) { wasBench = true; minutesPlayed = 90 - (on.minute || 90); }
  }

  let goals = 0, assists = 0, ownGoals = 0, penGoals = 0;
  for (const goal of matchData.goals ?? []) {
    if (goal.scorer?.id === personId) {
      if (goal.type === 'OWN_GOAL') ownGoals++;
      else { goals++; if (goal.type === 'PENALTY') penGoals++; }
    }
    if (goal.assist?.id === personId) assists++;
  }

  let yellowCards = 0, redCards = 0;
  for (const b of matchData.bookings ?? []) {
    if (b.player?.id !== personId) continue;
    if (b.card === 'YELLOW_CARD')       yellowCards++;
    else if (b.card === 'RED_CARD')     redCards++;
    else if (b.card === 'YELLOW_RED_CARD') { yellowCards++; redCards++; }
  }

  return { wasStarter, wasBench, minutesPlayed, goals, assists, ownGoals, penGoals, yellowCards, redCards };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapStatus(s) {
  if (s === 'FINISHED') return 'finished';
  if (['IN_PLAY', 'PAUSED', 'HALF_TIME'].includes(s)) return 'in_play';
  return 'scheduled';
}

async function resolveMatchDoc(fdMatch, fullMatchData) {
  let doc = await Match.findOne({ apiFootballId: fdMatch.id });
  if (!doc) {
    const [homeClub, awayClub] = await Promise.all([
      Club.findOne({ apiFootballId: fdMatch.homeTeam?.id }),
      Club.findOne({ apiFootballId: fdMatch.awayTeam?.id }),
    ]);
    doc = await Match.findOneAndUpdate(
      { apiFootballId: fdMatch.id },
      {
        $set: {
          apiFootballId: fdMatch.id,
          kickoffUtc:    new Date(fdMatch.utcDate),
          homeScore:     (fullMatchData || fdMatch).score?.fullTime?.home,
          awayScore:     (fullMatchData || fdMatch).score?.fullTime?.away,
          status:        mapStatus(fdMatch.status),
          competition:   fdMatch.competition?.name || '',
          season:        String(fdMatch.season?.startDate?.slice(0, 4) || ''),
          ...(homeClub && { homeClub: homeClub._id }),
          ...(awayClub && { awayClub: awayClub._id }),
        },
        $setOnInsert: { moroccansPlaying: [] },
      },
      { upsert: true, new: true }
    );
  }
  return doc;
}

// ── Full mode (Redis available — getMatch() responses cached 30 min) ──────────

async function _fullSync(players) {
  // In-process cache for getMatch results across players in the same run
  const matchCache = new Map();
  let written = 0;

  for (const playerDoc of players) {
    const personId = playerDoc.externalIds?.apiFootball;
    if (!personId) continue;

    let matchList;
    try {
      matchList = await fd.getPersonMatches(personId, MAX_RATINGS_PER_PLAYER, { status: 'FINISHED' });
    } catch (err) {
      console.error(`[Sync] syncRatings full — getPersonMatches failed for ${playerDoc.fullName}: ${err.message}`);
      continue;
    }

    for (const fdMatch of matchList.matches || []) {
      if (fdMatch.status !== 'FINISHED') continue;

      let fullMatch = matchCache.get(fdMatch.id);
      if (!fullMatch) {
        try {
          fullMatch = await fd.getMatch(fdMatch.id);
          matchCache.set(fdMatch.id, fullMatch);
        } catch (err) {
          console.error(`[Sync] syncRatings full — getMatch(${fdMatch.id}) failed: ${err.message}`);
          continue;
        }
      }

      const events = extractPlayerEvents(fullMatch, personId);
      if (!events) continue;

      const score = computeScore(events, playerDoc.primaryPosition);
      const matchDoc = await resolveMatchDoc(fdMatch, fullMatch).catch(() => null);
      if (!matchDoc) continue;

      try {
        await Rating.findOneAndUpdate(
          { player: playerDoc._id, match: matchDoc._id },
          {
            $set: {
              player: playerDoc._id, match: matchDoc._id,
              matchDate:    matchDoc.kickoffUtc,
              competition:  matchDoc.competition,
              homeTeam:     fullMatch.homeTeam?.name,
              awayTeam:     fullMatch.awayTeam?.name,
              homeScore:    fullMatch.score?.fullTime?.home,
              awayScore:    fullMatch.score?.fullTime?.away,
              minutes:      events.minutesPlayed,
              goals:        events.goals,
              assists:      events.assists,
              yellowCards:  events.yellowCards,
              redCards:     events.redCards,
              performanceScore:   score,
              computedFromEvents: score != null,
              matchEvents: {
                goals:            events.goals,
                assists:          events.assists,
                yellowCards:      events.yellowCards,
                redCards:         events.redCards,
                ownGoals:         events.ownGoals,
                penaltiesScored:  events.penGoals,
                minutesPlayed:    events.minutesPlayed,
                wasStarter:       events.wasStarter,
                wasBench:         events.wasBench,
              },
              dataQuality: score != null ? 'event' : 'heuristic',
            },
          },
          { upsert: true, new: true }
        );
        written++;
        await Match.findByIdAndUpdate(matchDoc._id, { $addToSet: { moroccansPlaying: playerDoc._id } }).catch(() => {});
      } catch (err) {
        console.error(`[Sync] syncRatings full — upsert failed for ${playerDoc.fullName}: ${err.message}`);
      }
    }

    await _pruneRatings(playerDoc._id);
  }

  return written;
}

// ── Heuristic mode (no Redis — only getPersonMatches, no getMatch) ────────────

async function _heuristicSync(players) {
  let written = 0;

  for (const playerDoc of players) {
    const personId = playerDoc.externalIds?.apiFootball;
    if (!personId) continue;

    let matchList;
    try {
      matchList = await fd.getPersonMatches(personId, MAX_RATINGS_PER_PLAYER, { status: 'FINISHED' });
    } catch (err) {
      console.error(`[Sync] syncRatings heuristic — getPersonMatches failed for ${playerDoc.fullName}: ${err.message}`);
      continue;
    }

    for (const fdMatch of matchList.matches || []) {
      if (fdMatch.status !== 'FINISHED') continue;

      const matchDoc = await resolveMatchDoc(fdMatch, null).catch(() => null);
      if (!matchDoc) continue;

      try {
        await Rating.findOneAndUpdate(
          { player: playerDoc._id, match: matchDoc._id },
          {
            $set: {
              player:       playerDoc._id,
              match:        matchDoc._id,
              matchDate:    matchDoc.kickoffUtc,
              competition:  fdMatch.competition?.name || '',
              homeTeam:     fdMatch.homeTeam?.name,
              awayTeam:     fdMatch.awayTeam?.name,
              homeScore:    fdMatch.score?.fullTime?.home,
              awayScore:    fdMatch.score?.fullTime?.away,
              minutes:      90,      // estimated — refined when Redis enables full mode
              dataQuality:  'heuristic',
              performanceScore:   null,
              computedFromEvents: false,
            },
          },
          { upsert: true, new: true }
        );
        written++;
        await Match.findByIdAndUpdate(matchDoc._id, { $addToSet: { moroccansPlaying: playerDoc._id } }).catch(() => {});
      } catch (err) {
        console.error(`[Sync] syncRatings heuristic — upsert failed for ${playerDoc.fullName}: ${err.message}`);
      }
    }

    await _pruneRatings(playerDoc._id);
  }

  return written;
}

async function _pruneRatings(playerId) {
  const all = await Rating.find({ player: playerId }).sort({ matchDate: -1 }).select('_id').lean();
  if (all.length > MAX_RATINGS_PER_PLAYER) {
    const toDelete = all.slice(MAX_RATINGS_PER_PLAYER).map(r => r._id);
    await Rating.deleteMany({ _id: { $in: toDelete } }).catch(() => {});
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

/**
 * @param {object} [opts]
 * @param {number} [opts.startIndex=0]  Player array skip offset (for chunk mode).
 * @param {number} [opts.limit=null]    Max players to process; null = all.
 * @returns {Promise<number|{written:number,processed:number}>}
 *   When called without opts → returns written count (backward compat).
 *   When called with opts   → returns { written, processed }.
 */
async function syncRatings({ startIndex = 0, limit = null } = {}) {
  const isChunked = limit !== null;

  const query = Player.find({
    'externalIds.apiFootball': { $exists: true, $ne: null },
    isMoroccanNational: true,
  }).sort({ _id: 1 });

  if (isChunked) query.skip(startIndex).limit(limit);

  const players = await query.lean();

  const redis = getRedis();
  const mode  = redis ? 'full (events + computeScore)' : 'heuristic (getPersonMatches only, no getMatch)';
  console.log(`[Sync] syncRatings — ${players.length} players | mode: ${mode}`);

  const written = redis
    ? await _fullSync(players)
    : await _heuristicSync(players);

  console.log(`[Sync] syncRatings — ${written} ratings written`);

  if (isChunked) return { written, processed: players.length };
  return written;
}

module.exports = syncRatings;

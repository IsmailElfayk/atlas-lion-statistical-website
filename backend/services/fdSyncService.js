/**
 * Football-Data.org Ingestion Service
 *
 * Replaces the API-Football-based nightlySync.js / ingestionService.js pipeline
 * for league, club, fixture, player, and rating data.
 * StatsBomb sync is unchanged — see ingestionService.js → syncStatsBombEvents().
 *
 * Rate limiting is handled transparently by footballDataClient.js
 * (10 req / 11-min sliding window; callers need not throttle manually).
 *
 * Estimated request budget for syncAll():
 *   Step 1 — getCompetitions       :   1 req
 *   Step 2 — getCompetitionTeams   :  12 req  (1 per free-tier competition)
 *   Step 3 — getCompetitionMatches :  12 req  (1 per free-tier competition)
 *   Step 4 — getTeamPlayers        : ~N req   (1 per club, ~20 per competition → ~240)
 *   Step 5 — getMatchLineups       : ~M req   (1 per finished match in last 30 days)
 *
 *   Without squads (daily):  ~25–85 req  → ~2 h
 *   With squads (weekly):   ~265–325 req → ~6 h
 */

const fd       = require('./footballDataClient');
const { getRedis } = require('../config/redis');
const { normalizePosition } = require('../utils/positionNormalizer');

const League  = require('../models/League');
const Club    = require('../models/Club');
const Player  = require('../models/Player');
const Match   = require('../models/Match');
const Rating  = require('../models/Rating');
const SyncLog = require('../models/SyncLog');

// ── Static lookup tables ──────────────────────────────────────────────────────

// football-data.org coarse position strings not already in positionNormalizer.js
const FD_EXTRA_POSITIONS = {
  Defence:  'CB',
  Midfield: 'CM',
  Offence:  'ST',
  Forward:  'ST',
};

// Confederation by competition code (League.confederation enum requires one of these values)
const CONFEDERATION_BY_CODE = {
  PL: 'UEFA', PD: 'UEFA', BL1: 'UEFA', SA: 'UEFA', FL1: 'UEFA',
  CL: 'UEFA', DED: 'UEFA', ELC: 'UEFA', PPL: 'UEFA', EC: 'UEFA',
  BSA: 'CONMEBOL',
  WC:  'UEFA', // no 'World' option in enum — UEFA is the safe fallback
};

const TIER_BY_CODE = {
  PL: 1, PD: 1, BL1: 1, SA: 1, FL1: 1, DED: 1, PPL: 1, BSA: 1,
  CL: 0, EC: 0, WC: 0,
  ELC: 2, // second tier
};

// Moroccan international last-name keywords for secondary player matching
// when the nationality field is absent or inconsistent in the squad endpoint
const MOROCCAN_KEYWORDS = new Set([
  'bounou', 'hakimi', 'mazraoui', 'aguerd', 'saiss', 'amrabat',
  'ounahi', 'ziyech', 'nesyri', 'boufal', 'sabiri', 'benoun',
  'dari', 'attiat', 'diaz', 'brahim',
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function currentSeason() {
  const now = new Date();
  const y   = now.getUTCFullYear();
  return now.getUTCMonth() + 1 >= 7 ? y : y - 1;
}

function toSlug(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function mapMatchStatus(fdStatus) {
  if (fdStatus === 'FINISHED') return 'finished';
  if (['IN_PLAY', 'PAUSED', 'HALF_TIME'].includes(fdStatus)) return 'in_play';
  return 'scheduled';
}

function normalizePos(raw) {
  return normalizePosition(raw) || FD_EXTRA_POSITIONS[raw] || null;
}

function isMoroccan(player) {
  if ((player.nationality || '').toLowerCase() === 'morocco') return true;
  const nameLower = (player.name || '').toLowerCase();
  for (const kw of MOROCCAN_KEYWORDS) {
    if (nameLower.includes(kw)) return true;
  }
  return false;
}

// ── Step 1: syncLeagues ──────────────────────────────────────────────────────

async function syncLeagues() {
  console.log('[FDSync] Step 1 — syncLeagues (1 API req)');

  const data = await fd.getCompetitions();
  const competitions = data.competitions || [];
  let upserted = 0;

  for (const comp of competitions) {
    const bucket        = fd.COMPETITION_BUCKET[comp.code];
    const confederation = CONFEDERATION_BY_CODE[comp.code] || 'UEFA';
    const tier          = TIER_BY_CODE[comp.code] ?? 1;

    try {
      await League.findOneAndUpdate(
        { name: comp.name },
        {
          $set: {
            name:                comp.name,
            country:             comp.area?.name || 'International',
            bucket,
            confederation,
            tier,
            logoUrl:             comp.emblem || null,
            hasEventData:        false,
            hasSofascoreRatings: false, // football-data.org free tier provides no match ratings
          },
        },
        { upsert: true, new: true }
      );
      upserted++;
    } catch (err) {
      console.error(`[FDSync] syncLeagues — failed for ${comp.name}: ${err.message}`);
    }
  }

  console.log(`[FDSync] syncLeagues — ${upserted} leagues upserted`);
  return upserted;
}

// ── Step 2: syncClubs ────────────────────────────────────────────────────────

async function syncClubs(season = String(currentSeason())) {
  console.log(`[FDSync] Step 2 — syncClubs (${fd.FREE_TIER_CODES.length} API req)`);
  let upserted = 0;

  for (const code of fd.FREE_TIER_CODES) {
    let data;
    try {
      data = await fd.getCompetitionTeams(code, season);
    } catch (err) {
      console.error(`[FDSync] syncClubs — API error for ${code}: ${err.message}`);
      continue;
    }

    const compName  = data.competition?.name;
    const leagueDoc = compName ? await League.findOne({ name: compName }) : null;

    for (const team of data.teams || []) {
      try {
        await Club.findOneAndUpdate(
          { apiFootballId: team.id },
          {
            $set: {
              apiFootballId: team.id,
              name:          team.name,
              shortName:     team.shortName || team.tla || team.name.slice(0, 6).toUpperCase(),
              country:       team.area?.name || leagueDoc?.country || null,
              logoUrl:       team.crest || null,
              ...(leagueDoc && { league: leagueDoc._id }),
            },
          },
          { upsert: true, new: true }
        );
        upserted++;
      } catch (err) {
        console.error(`[FDSync] syncClubs — failed for ${team.name}: ${err.message}`);
      }
    }
  }

  console.log(`[FDSync] syncClubs — ${upserted} clubs upserted`);
  return upserted;
}

// ── Step 3: syncFixtures ─────────────────────────────────────────────────────

async function syncFixtures(season = String(currentSeason())) {
  console.log(`[FDSync] Step 3 — syncFixtures (${fd.FREE_TIER_CODES.length} API req)`);
  let upserted = 0;

  for (const code of fd.FREE_TIER_CODES) {
    let data;
    try {
      data = await fd.getCompetitionMatches(code, season);
    } catch (err) {
      console.error(`[FDSync] syncFixtures — API error for ${code}: ${err.message}`);
      continue;
    }

    const compName  = data.competition?.name;
    const leagueDoc = compName ? await League.findOne({ name: compName }) : null;

    for (const match of data.matches || []) {
      const homeClub = await Club.findOne({ apiFootballId: match.homeTeam?.id });
      const awayClub = await Club.findOne({ apiFootballId: match.awayTeam?.id });
      const status   = mapMatchStatus(match.status);

      try {
        await Match.findOneAndUpdate(
          { apiFootballId: match.id },
          {
            $set: {
              apiFootballId:    match.id,
              kickoffUtc:       new Date(match.utcDate),
              homeScore:        match.score?.fullTime?.home ?? undefined,
              awayScore:        match.score?.fullTime?.away ?? undefined,
              status,
              competition:      compName || '',
              season:           String(season),
              moroccansPlaying: [], // populated in Step 5 after lineup data is fetched
              ...(leagueDoc && { league:   leagueDoc._id }),
              ...(homeClub  && { homeClub: homeClub._id }),
              ...(awayClub  && { awayClub: awayClub._id }),
            },
          },
          { upsert: true, new: true }
        );
        upserted++;
      } catch (err) {
        console.error(`[FDSync] syncFixtures — failed for match ${match.id}: ${err.message}`);
      }
    }
  }

  console.log(`[FDSync] syncFixtures — ${upserted} fixtures upserted`);
  return upserted;
}

// ── Step 4: syncSquads ───────────────────────────────────────────────────────

/**
 * For each club in the DB that has a football-data.org team ID, fetch its squad
 * and upsert Moroccan players.
 *
 * NOTE: if the DB contains clubs from a prior API-Football sync, their IDs belong
 * to a different ID space and the FD API will return 404; those are caught and
 * skipped. Wipe the DB with seed.js before the first real sync to avoid wasted
 * rate-limit quota.
 */
async function syncSquads(season = String(currentSeason())) {
  const clubs = await Club.find({ apiFootballId: { $exists: true } }).lean();
  console.log(`[FDSync] Step 4 — syncSquads (~${clubs.length} API req)`);
  let upserted = 0;

  for (const clubDoc of clubs) {
    let data;
    try {
      data = await fd.getTeamPlayers(clubDoc.apiFootballId, season);
    } catch (err) {
      console.error(`[FDSync] syncSquads — API error for club "${clubDoc.name}": ${err.message}`);
      continue;
    }

    for (const player of data.squad || []) {
      if (!isMoroccan(player)) continue;

      const cleanName = (player.name || '').trim();
      if (!cleanName) continue;

      const slug    = toSlug(cleanName);
      const normPos = normalizePos(player.position || '');

      try {
        await Player.findOneAndUpdate(
          {
            $or: [
              { 'externalIds.apiFootball': player.id },
              { slug },
            ],
          },
          {
            $set: {
              'externalIds.apiFootball': player.id,
              slug,
              fullName:           cleanName,
              nationalities:      [player.nationality].filter(Boolean),
              isMoroccanNational: true,
              currentClub:        clubDoc._id,
              lastSyncedAt:       new Date(),
              ...(player.dateOfBirth && { dob: new Date(player.dateOfBirth) }),
              ...(normPos && { primaryPosition: normPos }),
            },
            $setOnInsert: {
              moroccoEligibility: 'eligible',
              eligiblePositions:  [],
              status:             'available',
              minutesCurrent:     0,
            },
          },
          { upsert: true, new: true }
        );
        upserted++;
      } catch (err) {
        console.error(`[FDSync] syncSquads — failed for ${cleanName}: ${err.message}`);
      }
    }
  }

  console.log(`[FDSync] syncSquads — ${upserted} Moroccan players upserted`);
  return upserted;
}

// ── Step 5: syncLineupRatings ────────────────────────────────────────────────

/**
 * For each finished match in the last 30 days, fetch the lineup via the FD API
 * and create/update Rating docs for any Moroccan player found.
 *
 * football-data.org free tier provides no per-player ratings (Sofascore/FotMob).
 * Minutes are estimated: 90 for starters, 45 for substitutes — the Best XI
 * algorithm uses the heuristic fallback score of 6.0 for these entries.
 */
async function syncLineupRatings() {
  const since = new Date(Date.now() - 30 * 24 * 3600_000);
  const recentFinished = await Match.find({
    status: 'finished',
    kickoffUtc: { $gte: since },
  }).lean();

  console.log(`[FDSync] Step 5 — syncLineupRatings (~${recentFinished.length} API req)`);
  let written = 0;

  for (const matchDoc of recentFinished) {
    let data;
    try {
      data = await fd.getMatchLineups(matchDoc.apiFootballId);
    } catch (err) {
      console.error(`[FDSync] syncLineupRatings — API error match ${matchDoc.apiFootballId}: ${err.message}`);
      continue;
    }

    // Collect all players from both teams with their estimated minutes
    // 90 min for starters, 45 min for bench (rough estimate — exact sub times not available in FD free tier)
    const entries = [
      ...(data.homeTeam?.lineup ?? []).map(p => ({ ...p, minutes: 90 })),
      ...(data.awayTeam?.lineup ?? []).map(p => ({ ...p, minutes: 90 })),
      ...(data.homeTeam?.bench  ?? []).map(p => ({ ...p, minutes: 45 })),
      ...(data.awayTeam?.bench  ?? []).map(p => ({ ...p, minutes: 45 })),
    ];

    const moroccanIds = [];

    for (const entry of entries) {
      const playerDoc = await Player.findOne({
        'externalIds.apiFootball': entry.id,
      }).lean();
      if (!playerDoc) continue;

      moroccanIds.push(playerDoc._id);

      try {
        await Rating.findOneAndUpdate(
          { player: playerDoc._id, match: matchDoc._id },
          {
            $set: {
              player:           playerDoc._id,
              match:            matchDoc._id,
              matchDate:        matchDoc.kickoffUtc,
              minutes:          entry.minutes,
              sofascoreRating:  null, // Sofascore ratings unavailable in football-data.org free tier
              normalisedCustom: null,
              dataQuality:      'heuristic',
            },
          },
          { upsert: true, new: true }
        );
        written++;
      } catch (err) {
        console.error(`[FDSync] syncLineupRatings — rating failed for player ${entry.id}: ${err.message}`);
      }
    }

    // Back-fill Match.moroccansPlaying now that we know who played
    if (moroccanIds.length) {
      await Match.findByIdAndUpdate(matchDoc._id, {
        $addToSet: { moroccansPlaying: { $each: moroccanIds } },
      }).catch(() => {});
    }
  }

  console.log(`[FDSync] syncLineupRatings — ${written} ratings written`);
  return written;
}

// ── Cache eviction ───────────────────────────────────────────────────────────

async function evictBestXICache() {
  const redis = getRedis();
  if (!redis) return 0;

  let cursor = 0;
  let deleted = 0;
  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: 'bestxi:*', count: 100 });
      cursor = Number(nextCursor);
      if (keys.length) {
        await Promise.all(keys.map(k => redis.del(k)));
        deleted += keys.length;
      }
    } while (cursor !== 0);
    console.log(`[FDSync] Cache eviction — ${deleted} bestxi:* keys cleared`);
  } catch (err) {
    console.error(`[FDSync] Cache eviction failed: ${err.message}`);
  }
  return deleted;
}

// ── Full pipeline ────────────────────────────────────────────────────────────

/**
 * @param {object}  opts
 * @param {boolean} opts.includeSquads  Include Step 4 (getTeamPlayers per club).
 *                                      Expensive (~240 req); skip on daily runs,
 *                                      include on weekly runs.
 */
async function syncAll({ includeSquads = true } = {}) {
  const SEASON    = process.env.SYNC_SEASON || String(currentSeason());
  const startedAt = new Date();
  const errors    = [];
  const results   = {};

  // Estimate request count from current DB state before starting
  const clubCount  = await Club.countDocuments({ apiFootballId: { $exists: true } });
  const matchCount = await Match.countDocuments({
    status:     'finished',
    kickoffUtc: { $gte: new Date(Date.now() - 30 * 24 * 3600_000) },
  });
  const estReq     = 1 + 12 + 12 + (includeSquads ? clubCount : 0) + matchCount;
  const estBatches = Math.ceil(estReq / 10);
  const estMinutes = estBatches * 11;

  console.log('[FDSync] ══ START ══', startedAt.toISOString());
  console.log(`[FDSync] Estimated requests: ${estReq}`);
  console.log(`[FDSync]   competitions=1, teams=${fd.FREE_TIER_CODES.length}, matches=${fd.FREE_TIER_CODES.length}, squads=${includeSquads ? clubCount : 'skipped'}, lineups=${matchCount}`);
  console.log(`[FDSync] Estimated duration: ~${estMinutes} min (${estBatches} × 11-min batches at 10 req/batch)`);

  const stages = [
    { name: 'leagues',  fn: () => syncLeagues() },
    { name: 'clubs',    fn: () => syncClubs(SEASON) },
    { name: 'fixtures', fn: () => syncFixtures(SEASON) },
    ...(includeSquads ? [{ name: 'squads', fn: () => syncSquads(SEASON) }] : []),
    { name: 'ratings',  fn: () => syncLineupRatings() },
    { name: 'cache',    fn: () => evictBestXICache() },
  ];

  for (const stage of stages) {
    try {
      console.log(`[FDSync] ── ${stage.name} ──`);
      results[stage.name] = await stage.fn();
    } catch (err) {
      console.error(`[FDSync] ${stage.name} FAILED: ${err.message}`);
      results[stage.name] = { error: err.message };
      errors.push(`${stage.name}: ${err.message}`);
    }
  }

  const finishedAt = new Date();

  try {
    await SyncLog.create({
      startedAt,
      finishedAt,
      durationMs:      finishedAt - startedAt,
      playersUpserted: typeof results.squads  === 'number' ? results.squads  : 0,
      ratingsUpserted: typeof results.ratings === 'number' ? results.ratings : 0,
      errors,
    });
  } catch (err) {
    console.error('[FDSync] Failed to save SyncLog:', err.message);
  }

  console.log('[FDSync] ══ COMPLETE ══');
  console.log(JSON.stringify({ ...results, errors }, null, 2));
  return results;
}

module.exports = {
  syncLeagues,
  syncClubs,
  syncFixtures,
  syncSquads,
  syncLineupRatings,
  evictBestXICache,
  syncAll,
};

/**
 * Nightly Sync Service
 *
 * Single function that runs every midnight UTC:
 *   Step 1 — Reset key rotation
 *   Step 2 — Fetch all Moroccan players (paginated)
 *   Step 3 — For each player: fetch last 35 fixture ratings, cap at 35 in DB
 *   Step 4 — Update injury / availability status
 *   Step 5 — Log sync report → MongoDB SyncLog + console
 */

const apifootball = require('./apifootball');

const League  = require('../models/League');
const Club    = require('../models/Club');
const Player  = require('../models/Player');
const Match   = require('../models/Match');
const Rating  = require('../models/Rating');
const SyncLog = require('../models/SyncLog');
const { normalizePosition } = require('../utils/positionNormalizer');

function currentSeason() {
  const now = new Date();
  const y   = now.getUTCFullYear();
  // Football seasons start in July: Aug 2025 – Jun 2026 → season "2025"
  return now.getUTCMonth() + 1 >= 7 ? y : y - 1;
}

const SEASON = process.env.SYNC_SEASON || String(currentSeason());
const MAX_RATINGS_PER_PLAYER = 35;

const BIG5 = new Set([
  'Premier League', 'La Liga', 'LaLiga', 'Bundesliga', 'Serie A',
  'Ligue 1', 'Ligue 1 Uber Eats',
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function parseMinutes(raw) {
  if (raw == null) return 0;
  return parseInt(String(raw).replace("'", '').trim()) || 0;
}

// In-memory club cache to avoid redundant DB lookups across thousands of fixture rows
const _clubCache = {};

async function findOrUpsertClub(teamId, teamName) {
  const key = teamId ?? teamName;
  if (!key) return null;
  if (_clubCache[key]) return _clubCache[key];

  const doc = await Club.findOneAndUpdate(
    teamId
      ? { $or: [{ apiFootballId: teamId }, { name: teamName }] }
      : { name: teamName },
    {
      $set: {
        name: teamName,
        ...(teamId && { apiFootballId: teamId }),
      },
    },
    { upsert: true, new: true, lean: true }
  );

  _clubCache[key] = doc._id;
  return doc._id;
}

// ── Main export ───────────────────────────────────────────────────────────────

async function nightlySync() {
  const startedAt = new Date();
  const report = {
    startedAt,
    finishedAt     : null,
    durationMs     : 0,
    playersUpserted: 0,
    ratingsUpserted: 0,
    keysUsed       : 0,
    requestsPerKey : {},
    errors         : [],
  };

  // Per-run cache: avoids fetching the same /fixtures/players endpoint multiple
  // times when several Moroccan players appeared in the same match.
  const fixtureStatsCache = new Map();

  console.log('[NightlySync] ══ START ══', startedAt.toISOString());

  // ── STEP 1: Reset key rotation ─────────────────────────────────────────────
  apifootball.reset();

  // ── STEP 2: Fetch all Moroccan players (paginated) ─────────────────────────
  console.log('[NightlySync] Step 2 — fetching Moroccan players');
  let page       = 1;
  let totalPages = 1;
  let keysOut    = false;

  do {
    const data = await apifootball.get('/players', {
      nationality: 'Morocco',
      season: SEASON,
      page,
    });

    if (!data) {
      report.errors.push(`Keys exhausted during player pagination — page ${page}`);
      keysOut = true;
      break;
    }

    totalPages = data.paging?.total ?? 1;

    for (const item of data.response ?? []) {
      const { player, statistics } = item;
      if (!player?.id) continue;

      const stat      = statistics?.[0];
      const teamId    = stat?.team?.id   ?? null;
      const teamName  = stat?.team?.name ?? null;
      const clubId    = await findOrUpsertClub(teamId, teamName);
      const slug      = toSlug(player.name);

      try {
        await Player.findOneAndUpdate(
          { 'externalIds.apiFootball': player.id },
          {
            $set: {
              'externalIds.apiFootball': player.id,
              slug,
              fullName        : player.name,
              age             : player.age,
              photoUrl        : player.photo,
              primaryPosition : normalizePosition(stat?.games?.position) || 'CM',
              minutesCurrent  : stat?.games?.minutes ?? 0,
              lastSyncedAt    : new Date(),
              isMoroccanNational: true,
              ...(clubId && { currentClub: clubId }),
            },
            $setOnInsert: {
              moroccoEligibility: 'eligible',
              eligiblePositions : [],
              status            : 'available',
            },
          },
          { upsert: true, new: true }
        );
        report.playersUpserted++;
      } catch (err) {
        report.errors.push(`Player upsert failed — ${player.name}: ${err.message}`);
      }
    }

    page++;
  } while (page <= totalPages);

  console.log(`[NightlySync] Step 2 done — ${report.playersUpserted} players upserted`);

  if (keysOut) {
    return _finalise(report, startedAt);
  }

  // ── STEPS 3 & 4: Per-player fixture ratings + injuries ─────────────────────
  const allPlayers = await Player.find({ 'externalIds.apiFootball': { $exists: true } }).lean();
  console.log(`[NightlySync] Steps 3+4 — processing ${allPlayers.length} players`);

  for (const playerDoc of allPlayers) {
    if (keysOut) break;

    const apifbId = playerDoc.externalIds?.apiFootball;
    if (!apifbId) continue;

    // ── STEP 3: last 35 fixture ratings ─────────────────────────────────────

    const fixtureListData = await apifootball.get('/fixtures', {
      player: apifbId,
      season: SEASON,
      last  : MAX_RATINGS_PER_PLAYER,
    });

    if (!fixtureListData) {
      report.errors.push(`Keys exhausted — fixture list for player ${apifbId}`);
      keysOut = true;
      break;
    }

    const fixtures = fixtureListData.response ?? [];

    for (const fixtureItem of fixtures) {
      if (keysOut) break;

      const fixtureId  = fixtureItem.fixture?.id;
      if (!fixtureId) continue;

      const leagueName = fixtureItem.league?.name ?? '';
      const dataQ      = BIG5.has(leagueName) ? 'event' : 'rating';

      // Upsert a Match doc so Rating.match (required ref) is satisfied
      let matchDoc;
      try {
        const leagueDoc = leagueName
          ? await League.findOne({ name: leagueName }).select('_id').lean()
          : null;

        const homeClubId = await findOrUpsertClub(
          fixtureItem.teams?.home?.id,
          fixtureItem.teams?.home?.name
        );
        const awayClubId = await findOrUpsertClub(
          fixtureItem.teams?.away?.id,
          fixtureItem.teams?.away?.name
        );

        matchDoc = await Match.findOneAndUpdate(
          { apiFootballId: fixtureId },
          {
            $set: {
              apiFootballId: fixtureId,
              kickoffUtc   : new Date(fixtureItem.fixture.date),
              homeScore    : fixtureItem.goals?.home ?? undefined,
              awayScore    : fixtureItem.goals?.away ?? undefined,
              status       : 'finished',
              competition  : leagueName,
              season       : String(SEASON),
              ...(leagueDoc  && { league  : leagueDoc._id }),
              ...(homeClubId && { homeClub: homeClubId }),
              ...(awayClubId && { awayClub: awayClubId }),
            },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        report.errors.push(`Match upsert failed — fixture ${fixtureId}: ${err.message}`);
        continue;
      }

      // Fetch per-player stats for this fixture (cached — many Moroccan players
      // share the same fixture, so we only call the API once per fixture ID).
      let statsData;
      if (fixtureStatsCache.has(fixtureId)) {
        statsData = fixtureStatsCache.get(fixtureId);
      } else {
        statsData = await apifootball.get('/fixtures/players', { fixture: fixtureId });
        if (!statsData) {
          report.errors.push(`Keys exhausted — fixture stats fixture ${fixtureId}`);
          keysOut = true;
          break;
        }
        fixtureStatsCache.set(fixtureId, statsData);
      }

      // Find this player's entry in the response
      let stat = null;
      for (const team of statsData.response ?? []) {
        for (const p of team.players ?? []) {
          if (p.player?.id === apifbId) {
            stat = p.statistics?.[0] ?? null;
            break;
          }
        }
        if (stat) break;
      }
      if (!stat) continue;

      const sofascoreRating = stat.games?.rating ? parseFloat(stat.games.rating) : null;

      try {
        await Rating.findOneAndUpdate(
          { player: playerDoc._id, match: matchDoc._id },
          {
            $set: {
              player          : playerDoc._id,
              match           : matchDoc._id,
              matchDate       : new Date(fixtureItem.fixture.date),
              competition     : leagueName,
              homeTeam        : fixtureItem.teams?.home?.name,
              awayTeam        : fixtureItem.teams?.away?.name,
              homeScore       : fixtureItem.goals?.home,
              awayScore       : fixtureItem.goals?.away,
              minutes         : parseMinutes(stat.games?.minutes),
              sofascoreRating : isNaN(sofascoreRating) ? null : sofascoreRating,
              goals           : stat.goals?.total    ?? 0,
              assists         : stat.goals?.assists  ?? 0,
              yellowCards     : stat.cards?.yellow   ?? 0,
              redCards        : stat.cards?.red      ?? 0,
              saves           : stat.goals?.saves    ?? null,
              dataQuality     : dataQ,
            },
          },
          { upsert: true, new: true }
        );
        report.ratingsUpserted++;
      } catch (err) {
        report.errors.push(`Rating upsert failed — player ${apifbId} fixture ${fixtureId}: ${err.message}`);
      }
    } // end fixture loop

    // Cap at MAX_RATINGS_PER_PLAYER most recent docs
    try {
      const count = await Rating.countDocuments({ player: playerDoc._id });
      if (count > MAX_RATINGS_PER_PLAYER) {
        const oldest = await Rating.find({ player: playerDoc._id })
          .sort({ matchDate: 1 })
          .limit(count - MAX_RATINGS_PER_PLAYER)
          .select('_id')
          .lean();
        await Rating.deleteMany({ _id: { $in: oldest.map(r => r._id) } });
      }
    } catch (err) {
      report.errors.push(`Rating cap failed — player ${playerDoc._id}: ${err.message}`);
    }

    // ── STEP 4: injury / availability ────────────────────────────────────────
    if (keysOut) break;

    const injuryData = await apifootball.get('/injuries', { player: apifbId, season: SEASON });

    if (!injuryData) {
      report.errors.push(`Keys exhausted — injury check player ${apifbId}`);
      keysOut = true;
      break;
    }

    const injuries = injuryData.response ?? [];
    if (injuries.length > 0) {
      const latest  = injuries[0];
      const reason  = (latest.player?.reason ?? '').toLowerCase();
      const status  = reason.includes('suspension') ? 'suspended' : 'injured';
      const retDate = latest.fixture?.date ? new Date(latest.fixture.date) : null;

      await Player.findByIdAndUpdate(playerDoc._id, {
        $set: { status, ...(retDate && { returnDate: retDate }) },
      });
    } else {
      // No current injury reports → player is available
      await Player.findByIdAndUpdate(playerDoc._id, {
        $set: { status: 'available', returnDate: null },
      });
    }
  } // end player loop

  return _finalise(report, startedAt);
}

// ── Finalise report ───────────────────────────────────────────────────────────

async function _finalise(report, startedAt) {
  const finishedAt = new Date();
  report.finishedAt = finishedAt;
  report.durationMs = finishedAt - startedAt;

  const keyStates = apifootball.getKeyStates();
  report.keysUsed = keyStates.filter(s => s.requestsMade > 0).length;
  keyStates.forEach(s => {
    if (s.requestsMade > 0) {
      report.requestsPerKey[s.label] = s.requestsMade;
    }
  });

  console.log('[NightlySync] ══ COMPLETE ══');
  console.log(JSON.stringify(report, null, 2));

  try {
    await SyncLog.create(report);
  } catch (err) {
    console.error('[NightlySync] Failed to save SyncLog:', err.message);
  }

  return report;
}

module.exports = { nightlySync };

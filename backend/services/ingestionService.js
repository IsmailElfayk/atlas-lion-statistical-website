/**
 * Ingestion Service
 * Orchestrates syncing data from API-Football, TheSportsDB, and StatsBomb
 * into the MongoDB collections used by the Best XI algorithm.
 *
 * Rate limits:
 *   API-Football : 100 req/day  — every call goes through Redis cache (23h TTL)
 *   TheSportsDB  : 30 req/min   — used only for metadata enrichment
 *   StatsBomb    : unlimited    — public GitHub files, cached in Redis (7d TTL)
 */

const apifootball = require('./apifootball');
const sportsdb    = require('../config/sportsdb');
const statsbomb   = require('../config/statsbomb');
const { getRedis }  = require('../config/redis');

const League   = require('../models/League');
const Club     = require('../models/Club');
const Player   = require('../models/Player');
const Match    = require('../models/Match');
const Rating   = require('../models/Rating');
const SyncLog  = require('../models/SyncLog');

const { LEAGUE_BUCKET_MAP, MOROCCO_RELEVANT_LEAGUES } = require('../utils/leagueIdMap');
const { normalizePosition } = require('../utils/positionNormalizer');

function currentSeason() {
  const now = new Date();
  const y   = now.getUTCFullYear();
  return now.getUTCMonth() + 1 >= 7 ? y : y - 1;
}

const SEASON = process.env.SYNC_SEASON || String(currentSeason());

// Moroccan nationality values returned by API-Football
const MOROCCAN_NATIONALITIES = new Set(['Morocco', 'Maroc', 'Marocco', 'Marokko', 'Marruecos']);

// StatsBomb Morocco team ID and relevant competition IDs
const SB_MOROCCO_TEAM_ID   = 1763;
const SB_COMPETITIONS = [
  { competition_id: 1,  season_id: 1 },   // FIFA World Cup 2018 (S1)
  { competition_id: 43, season_id: 3869 }, // FIFA World Cup 2022
  { competition_id: 6,  season_id: 1 },   // AFCON 2019 (S1 - available in open data)
];

// ─── helpers ────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(str) {
  return str
    .replace(/&apos;/g, "'").replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function toSlug(name) {
  return decodeHtml(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function lastNameSlug(name) {
  const parts = decodeHtml(name).trim().split(/\s+/);
  return toSlug(parts[parts.length - 1]);
}

/** Cache wrapper for StatsBomb GitHub files — longer TTL (7 days). */
async function statsbombCached(path) {
  const redis = getRedis();
  const cacheKey = `sb:${path}`;

  if (redis) {
    try {
      const hit = await redis.get(cacheKey);
      if (hit !== null) return hit;
    } catch { /* skip */ }
  }

  const res = await statsbomb.get(path);
  const data = res.data;

  if (redis) {
    redis.set(cacheKey, data, { ex: 7 * 24 * 3600 }).catch(() => {});
  }

  return data;
}

// ─── syncLeagues ─────────────────────────────────────────────────────────────

/**
 * Fetch leagues from API-Football and upsert into the League collection.
 * Only syncs leagues present in LEAGUE_BUCKET_MAP.
 */
async function syncLeagues() {
  console.log('[Ingestion] syncLeagues — start');
  const data = await apifootball.get('/leagues', { type: 'League', current: true });
  const leagues = data?.response || [];
  let upserted = 0;

  for (const item of leagues) {
    const { league, country } = item;
    if (!LEAGUE_BUCKET_MAP[league.id]) continue;

    const bucket = LEAGUE_BUCKET_MAP[league.id];
    const confederation = confederationForCountry(country?.name);

    try {
      await League.findOneAndUpdate(
        { apiFootballId: league.id },
        {
          $set: {
            apiFootballId: league.id,
            name:          league.name,
            country:       country?.name || 'International',
            bucket,
            confederation,
            logoUrl:       league.logo,
            hasSofascoreRatings: true,
            hasEventData:  false,
          },
        },
        { upsert: true, new: true }
      );
      upserted++;
    } catch (err) {
      console.error(`[Ingestion] syncLeagues — failed for ${league.name}: ${err.message}`);
    }
  }

  console.log(`[Ingestion] syncLeagues — ${upserted} leagues upserted`);
  return upserted;
}

// ─── syncClubs ───────────────────────────────────────────────────────────────

/**
 * Fetch teams for each league from API-Football, enrich with TheSportsDB
 * colors/logos, and upsert into the Club collection.
 */
async function syncClubs(leagueIds = MOROCCO_RELEVANT_LEAGUES) {
  console.log(`[Ingestion] syncClubs — ${leagueIds.length} leagues`);
  let upserted = 0;

  for (const leagueId of leagueIds) {
    const leagueDoc = await League.findOne({ apiFootballId: leagueId });
    if (!leagueDoc) {
      console.warn(`[Ingestion] syncClubs — league ${leagueId} not in DB, run syncLeagues first`);
      continue;
    }

    let data;
    try {
      data = await apifootball.get('/teams', { league: leagueId, season: SEASON });
    } catch (err) {
      console.error(`[Ingestion] syncClubs — API error for league ${leagueId}: ${err.message}`);
      continue;
    }

    const teams = data?.response || [];

    for (const item of teams) {
      const { team, venue } = item;

      // Try to get color from TheSportsDB
      let color = null;
      let logoUrl = team.logo || null;
      try {
        const sdb = await sportsdb.get('/searchteams.php', { params: { t: team.name } });
        const sdbTeam = sdb.data?.teams?.[0];
        if (sdbTeam) {
          color  = sdbTeam.strColour1 ? `#${sdbTeam.strColour1.replace('#', '')}` : null;
          logoUrl = sdbTeam.strTeamBadge || logoUrl;
        }
        await delay(100); // respect TheSportsDB 30 req/min
      } catch {
        // non-fatal — proceed without color
      }

      try {
        await Club.findOneAndUpdate(
          { apiFootballId: team.id },
          {
            $set: {
              apiFootballId: team.id,
              name:          team.name,
              shortName:     team.name.slice(0, 6).toUpperCase(),
              league:        leagueDoc._id,
              country:       team.country || leagueDoc.country,
              logoUrl,
              ...(color && { color }),
            },
          },
          { upsert: true, new: true }
        );
        upserted++;
      } catch (err) {
        console.error(`[Ingestion] syncClubs — failed for ${team.name}: ${err.message}`);
      }
    }

    await delay(200); // small pause between leagues
  }

  console.log(`[Ingestion] syncClubs — ${upserted} clubs upserted`);
  return upserted;
}

// ─── syncPlayers ─────────────────────────────────────────────────────────────

/**
 * Fetch players per league from API-Football.
 * - For Botola (149): syncs all players (small league, all Moroccan).
 * - For other leagues: filters to Moroccan nationality only.
 * Paginates up to MAX_PAGES to stay within daily quota.
 */
async function syncPlayers(leagueIds = MOROCCO_RELEVANT_LEAGUES) {
  console.log(`[Ingestion] syncPlayers — ${leagueIds.length} leagues`);
  const MAX_PAGES    = 3;   // cap pages per league to save daily quota (100 req/day free tier)
  const BOTOLA_ID    = 149;
  let upserted = 0;

  for (const leagueId of leagueIds) {
    const leagueDoc = await League.findOne({ apiFootballId: leagueId });

    for (let page = 1; page <= MAX_PAGES; page++) {
      let data;
      try {
        data = await apifootball.get('/players', { league: leagueId, season: SEASON, page });
      } catch (err) {
        console.error(`[Ingestion] syncPlayers — API error league ${leagueId} p${page}: ${err.message}`);
        break;
      }

      const players = data?.response || [];
      if (!players.length) break;

      let moroccanOnPage = 0;

      for (const item of players) {
        const { player, statistics } = item;
        const stat = statistics?.[0];

        // Only keep Moroccan players for non-Botola leagues
        const isMoroccan = leagueId === BOTOLA_ID ||
          MOROCCAN_NATIONALITIES.has(player.nationality);
        if (!isMoroccan) continue;

        moroccanOnPage++;

        const rawPos   = stat?.games?.position || '';
        const normPos  = normalizePosition(rawPos);
        const clubDoc  = stat?.team?.id
          ? await Club.findOne({ apiFootballId: stat.team.id })
          : null;

        const cleanName = decodeHtml(player.name);
        const slug      = toSlug(cleanName);
        const lnSlug    = lastNameSlug(cleanName);

        try {
          await Player.findOneAndUpdate(
            { $or: [
                { 'externalIds.apiFootball': player.id },
                { slug },
                // Abbreviated API name "A. Hakimi" → match seed "achraf_hakimi" via last name
                { slug: { $regex: `(^|_)${lnSlug}$` } },
            ]},
            {
              $set: {
                'externalIds.apiFootball': player.id,
                slug,
                fullName:    cleanName,
                dob:         player.birth?.date ? new Date(player.birth.date) : undefined,
                age:         player.age,
                height:      player.height ? parseInt(player.height) : undefined,
                preferredFoot: player.birth?.country || undefined,
                photoUrl:    player.photo,
                ...(normPos && { primaryPosition: normPos }),
                isMoroccanNational: true,
                nationalities: [player.nationality].filter(Boolean),
                ...(clubDoc && { currentClub: clubDoc._id }),
                minutesCurrent: stat?.games?.minutes || 0,
                status: 'available',
              },
              $setOnInsert: {
                moroccoEligibility: 'eligible',
                eligiblePositions:  [],
              },
            },
            { upsert: true, new: true }
          );
          upserted++;
        } catch (err) {
          console.error(`[Ingestion] syncPlayers — failed for ${player.name}: ${err.message}`);
        }
      }

      // If it's a big league and no Moroccan players on this page, stop paginating
      if (leagueId !== BOTOLA_ID && moroccanOnPage === 0 && page > 1) break;

      const totalPages = data?.paging?.total || 1;
      if (page >= totalPages) break;

      await delay(300);
    }
  }

  console.log(`[Ingestion] syncPlayers — ${upserted} players upserted`);
  return upserted;
}

// ─── syncFixtures ────────────────────────────────────────────────────────────

/**
 * Fetch fixtures per league/season and upsert into Match collection.
 * Sets moroccansPlaying array from players who have that club in their currentClub.
 */
async function syncFixtures(leagueIds = MOROCCO_RELEVANT_LEAGUES, season = SEASON) {
  console.log(`[Ingestion] syncFixtures — ${leagueIds.length} leagues`);
  let upserted = 0;

  for (const leagueId of leagueIds) {
    const leagueDoc = await League.findOne({ apiFootballId: leagueId });

    let data;
    try {
      data = await apifootball.get('/fixtures', { league: leagueId, season });
    } catch (err) {
      console.error(`[Ingestion] syncFixtures — API error league ${leagueId}: ${err.message}`);
      continue;
    }

    const fixtures = data?.response || [];

    for (const item of fixtures) {
      const { fixture, teams, goals } = item;

      const homeClub = await Club.findOne({ apiFootballId: teams.home.id });
      const awayClub = await Club.findOne({ apiFootballId: teams.away.id });

      // Find Moroccan players in both clubs
      const clubIds = [homeClub?._id, awayClub?._id].filter(Boolean);
      const moroccanPlayers = await Player.find(
        { currentClub: { $in: clubIds }, isMoroccanNational: true },
        '_id'
      );

      const status = mapFixtureStatus(fixture.status?.short);

      try {
        await Match.findOneAndUpdate(
          { apiFootballId: fixture.id },
          {
            $set: {
              apiFootballId: fixture.id,
              league:        leagueDoc?._id,
              season:        String(season),
              kickoffUtc:    new Date(fixture.date),
              homeClub:      homeClub?._id,
              awayClub:      awayClub?._id,
              homeScore:     goals?.home ?? undefined,
              awayScore:     goals?.away ?? undefined,
              status,
              competition:   item.league?.name || '',
              moroccansPlaying: moroccanPlayers.map((p) => p._id),
            },
          },
          { upsert: true, new: true }
        );
        upserted++;
      } catch (err) {
        console.error(`[Ingestion] syncFixtures — failed for fixture ${fixture.id}: ${err.message}`);
      }
    }

    await delay(200);
  }

  console.log(`[Ingestion] syncFixtures — ${upserted} fixtures upserted`);
  return upserted;
}

// ─── syncRatings ─────────────────────────────────────────────────────────────

/**
 * Fetch per-player statistics for finished fixtures and write Rating docs.
 * If fixtureIds is empty, defaults to fixtures played in the last 48 hours.
 */
async function syncRatings(fixtureIds = []) {
  console.log(`[Ingestion] syncRatings — ${fixtureIds.length || 'auto (48h)'} fixtures`);

  let targetFixtures;
  if (fixtureIds.length) {
    targetFixtures = await Match.find({ apiFootballId: { $in: fixtureIds } });
  } else {
    // Default: 20 most recent finished fixtures that had Moroccan players
    targetFixtures = await Match.find({
      status: 'finished',
      moroccansPlaying: { $exists: true, $not: { $size: 0 } },
    }).sort({ kickoffUtc: -1 }).limit(20);
  }

  let written = 0;

  for (const matchDoc of targetFixtures) {
    // Determine dataQuality from the league bucket
    const leagueDoc   = matchDoc.league ? await League.findById(matchDoc.league).lean() : null;
    const dataQuality = leagueDoc?.bucket === 'big5' ? 'event' : 'rating';

    let data;
    try {
      data = await apifootball.get('/fixtures/players', { fixture: matchDoc.apiFootballId });
    } catch (err) {
      console.error(`[Ingestion] syncRatings — API error fixture ${matchDoc.apiFootballId}: ${err.message}`);
      continue;
    }

    const teams = data?.response || [];

    for (const teamData of teams) {
      for (const pData of teamData.players || []) {
        const { player, statistics } = pData;
        const stat = statistics?.[0];
        if (!stat) continue;

        const ratingRaw = stat.games?.rating;
        if (!ratingRaw) continue;

        const sofascoreRating = parseFloat(ratingRaw);
        if (isNaN(sofascoreRating)) continue;

        const minutes = stat.games?.minutes || 0;
        if (minutes < 1) continue;

        const playerDoc = await Player.findOne({ 'externalIds.apiFootball': player.id });
        if (!playerDoc) continue; // only rate players we track

        try {
          await Rating.findOneAndUpdate(
            { player: playerDoc._id, match: matchDoc._id },
            {
              $set: {
                player:          playerDoc._id,
                match:           matchDoc._id,
                matchDate:       matchDoc.kickoffUtc,
                minutes,
                sofascoreRating,
                dataQuality,
              },
            },
            { upsert: true, new: true }
          );
          written++;
        } catch (err) {
          console.error(`[Ingestion] syncRatings — failed for player ${player.id}: ${err.message}`);
        }
      }
    }

    await delay(200);
  }

  console.log(`[Ingestion] syncRatings — ${written} ratings written`);
  return written;
}

// ─── syncInjuries ────────────────────────────────────────────────────────────

/**
 * Fetch injury/suspension data from API-Football and update Player.status + returnDate.
 */
async function syncInjuries(leagueIds = MOROCCO_RELEVANT_LEAGUES) {
  console.log(`[Ingestion] syncInjuries — ${leagueIds.length} leagues`);
  let updated = 0;

  // First reset all known players to available (re-set below if still injured)
  await Player.updateMany({ isMoroccanNational: true }, { $set: { status: 'available', returnDate: null } });

  for (const leagueId of leagueIds) {
    let data;
    try {
      data = await apifootball.get('/injuries', { league: leagueId, season: SEASON });
    } catch (err) {
      console.error(`[Ingestion] syncInjuries — API error league ${leagueId}: ${err.message}`);
      continue;
    }

    const injuries = data?.response || [];

    for (const item of injuries) {
      const { player, team, fixture } = item;

      const playerDoc = await Player.findOne({ 'externalIds.apiFootball': player.id });
      if (!playerDoc) continue;

      const reason  = (player.reason || '').toLowerCase();
      const status  = reason.includes('suspension') ? 'suspended' : 'injured';
      const gameDate = fixture?.date ? new Date(fixture.date) : null;

      try {
        await Player.findByIdAndUpdate(playerDoc._id, {
          $set: {
            status,
            ...(gameDate && { returnDate: gameDate }),
          },
        });
        updated++;
      } catch (err) {
        console.error(`[Ingestion] syncInjuries — failed for ${player.name}: ${err.message}`);
      }
    }

    await delay(200);
  }

  console.log(`[Ingestion] syncInjuries — ${updated} players updated`);
  return updated;
}

// ─── syncStatsBombEvents ─────────────────────────────────────────────────────

/**
 * Pull StatsBomb open-data event files for Morocco-related competitions,
 * compute a simplified xT proxy per player, and update Rating.normalisedCustom.
 *
 * xT proxy = (shots × 0.10 + key_passes × 0.07 + progressive_carries × 0.03) × 90 / minutes
 * Then z-scored within position group and scaled to [3.0, 10.0].
 */
async function syncStatsBombEvents() {
  console.log('[Ingestion] syncStatsBombEvents — start');

  // Fetch available competitions
  let competitions;
  try {
    competitions = await statsbombCached('/competitions.json');
  } catch (err) {
    console.error(`[Ingestion] syncStatsBombEvents — cannot fetch competitions: ${err.message}`);
    return 0;
  }

  // Filter to the competitions we care about
  const relevant = competitions.filter((c) =>
    SB_COMPETITIONS.some(
      (s) => s.competition_id === c.competition_id && s.season_id === c.season_id
    )
  );

  if (!relevant.length) {
    console.warn('[Ingestion] syncStatsBombEvents — no matching competitions found in open data');
    return 0;
  }

  const playerStats = {}; // apiFootballSlug → { pos, minutes, shots, keyPasses, progCarries }

  for (const comp of relevant) {
    let matches;
    try {
      matches = await statsbombCached(
        `/matches/${comp.competition_id}/${comp.season_id}.json`
      );
    } catch {
      continue;
    }

    // Filter to matches where Morocco played
    const moroccoMatches = matches.filter(
      (m) => m.home_team?.home_team_id === SB_MOROCCO_TEAM_ID ||
             m.away_team?.away_team_id === SB_MOROCCO_TEAM_ID
    );

    for (const matchMeta of moroccoMatches) {
      let events;
      try {
        events = await statsbombCached(`/events/${matchMeta.match_id}.json`);
      } catch {
        continue;
      }

      // Aggregate per-player xT proxy metrics
      for (const ev of events) {
        // Only Morocco players
        if (ev.team?.id !== SB_MOROCCO_TEAM_ID) continue;

        const pid   = ev.player?.id;
        const pname = ev.player?.name;
        if (!pid) continue;

        if (!playerStats[pid]) {
          playerStats[pid] = { name: pname, minutes: 0, shots: 0, keyPasses: 0, progCarries: 0 };
        }
        const ps = playerStats[pid];

        switch (ev.type?.name) {
          case 'Shot':
            ps.shots += 1;
            break;
          case 'Pass':
            if (ev.pass?.goal_assist || ev.pass?.shot_assist) ps.keyPasses += 1;
            break;
          case 'Carry':
            // Progressive: carry that enters the final third
            if (ev.carry?.end_location?.[0] >= 80) ps.progCarries += 1;
            break;
          default:
            break;
        }
      }

      // Estimate minutes from starting lineup + substitutions
      for (const ev of events) {
        if (ev.team?.id !== SB_MOROCCO_TEAM_ID) continue;
        if (ev.type?.name === 'Starting XI') {
          for (const lineup of ev.tactics?.lineup || []) {
            const pid = lineup.player?.id;
            if (pid && playerStats[pid]) {
              playerStats[pid].minutes = (playerStats[pid].minutes || 0) + (matchMeta.match_week ? 90 : 90);
            }
          }
        }
      }
    }

    await delay(500);
  }

  if (!Object.keys(playerStats).length) {
    console.log('[Ingestion] syncStatsBombEvents — no player stats collected');
    return 0;
  }

  // Compute raw xT proxy per 90 for each player
  const rawScores = Object.entries(playerStats).map(([sbId, ps]) => {
    const min = Math.max(ps.minutes, 1);
    const raw = (ps.shots * 0.10 + ps.keyPasses * 0.07 + ps.progCarries * 0.03) * 90 / min;
    return { sbId, name: ps.name, raw };
  });

  // Z-score across all players, scale to [3, 10] centred at 6.5
  const vals    = rawScores.map((r) => r.raw);
  const mean    = vals.reduce((s, v) => s + v, 0) / vals.length;
  const std     = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length) || 1;
  const scaled  = rawScores.map((r) => ({
    ...r,
    normalisedCustom: Math.min(10, Math.max(3, 6.5 + ((r.raw - mean) / std) * 1.2)),
  }));

  let written = 0;

  for (const s of scaled) {
    // Try to match StatsBomb player name → our Player doc
    const playerDoc = await Player.findOne({
      fullName: { $regex: new RegExp(s.name.split(' ').slice(-1)[0], 'i') },
      isMoroccanNational: true,
    });
    if (!playerDoc) continue;

    // Update or create a Rating doc linked to a placeholder match
    // (StatsBomb events don't always align with our Match collection)
    try {
      await Rating.updateMany(
        { player: playerDoc._id, dataQuality: 'rating' },
        {
          $set: {
            normalisedCustom: Math.round(s.normalisedCustom * 10) / 10,
            dataQuality: 'event',
          },
        }
      );
      written++;
    } catch (err) {
      console.error(`[Ingestion] syncStatsBombEvents — failed for ${s.name}: ${err.message}`);
    }
  }

  console.log(`[Ingestion] syncStatsBombEvents — ${written} players enriched with event data`);
  return written;
}

// ─── preWarmCache ────────────────────────────────────────────────────────────

/**
 * Invalidate all Best XI cache entries in Upstash Redis after any sync.
 * Uses SCAN to avoid blocking the server (no KEYS * in production).
 */
async function preWarmCache() {
  const redis = getRedis();
  if (!redis) return;

  let cursor = 0;
  let deleted = 0;
  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: 'bestxi:*', count: 100 });
      cursor = Number(nextCursor);
      if (keys.length) {
        await Promise.all(keys.map((k) => redis.del(k)));
        deleted += keys.length;
      }
    } while (cursor !== 0);
    console.log(`[Ingestion] preWarmCache — ${deleted} bestxi:* keys evicted`);
  } catch (err) {
    console.error(`[Ingestion] preWarmCache — error: ${err.message}`);
  }
}

// ─── Full pipeline ───────────────────────────────────────────────────────────

/**
 * Run the complete ingestion pipeline in sequence.
 * Adds a 1-second pause between stages to respect API-Football's rate limit.
 */
async function syncAll() {
  const startedAt = new Date();
  const errors    = [];
  const results   = {};

  const stages = [
    { name: 'leagues',        fn: () => syncLeagues() },
    { name: 'clubs',          fn: () => syncClubs() },
    { name: 'players',        fn: () => syncPlayers() },
    { name: 'fixtures',       fn: () => syncFixtures() },
    { name: 'ratings',        fn: () => syncRatings() },
    { name: 'injuries',       fn: () => syncInjuries() },
    { name: 'statsbomb',      fn: () => syncStatsBombEvents() },
    { name: 'cache_eviction', fn: () => preWarmCache() },
  ];

  for (const stage of stages) {
    try {
      console.log(`[Ingestion] ── ${stage.name} ──`);
      results[stage.name] = await stage.fn();
    } catch (err) {
      console.error(`[Ingestion] ${stage.name} FAILED: ${err.message}`);
      results[stage.name] = { error: err.message };
      errors.push(`${stage.name}: ${err.message}`);
    }
    await delay(1000);
  }

  const finishedAt = new Date();
  try {
    await SyncLog.create({
      startedAt,
      finishedAt,
      durationMs      : finishedAt - startedAt,
      playersUpserted : typeof results.players === 'number' ? results.players : 0,
      ratingsUpserted : typeof results.ratings === 'number' ? results.ratings : 0,
      errors,
    });
  } catch (err) {
    console.error('[Ingestion] Failed to save SyncLog:', err.message);
  }

  return results;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function confederationForCountry(country) {
  const UEFA_COUNTRIES = new Set(['England','France','Germany','Spain','Italy','Netherlands','Belgium','Turkey','Greece','Portugal','Denmark','Sweden','Scotland','Switzerland','Austria','Norway','Finland','Czech Republic','Slovakia','Hungary','Romania','Bulgaria','Croatia','Serbia','Ukraine','Russia']);
  const CAF_COUNTRIES  = new Set(['Morocco','Egypt','Tunisia','Algeria','Nigeria','Ghana','Senegal','Ivory Coast','Cameroon','South Africa','Kenya','Ethiopia']);
  const AFC_COUNTRIES  = new Set(['Saudi Arabia','Qatar','UAE','Iran','Japan','South Korea','China','Iraq','Syria','Jordan']);
  const CONMEBOL       = new Set(['Brazil','Argentina','Colombia','Chile','Uruguay','Peru','Ecuador','Paraguay','Bolivia','Venezuela']);

  if (!country) return 'UEFA';
  if (UEFA_COUNTRIES.has(country)) return 'UEFA';
  if (CAF_COUNTRIES.has(country))  return 'CAF';
  if (AFC_COUNTRIES.has(country))  return 'AFC';
  if (CONMEBOL.has(country))       return 'CONMEBOL';
  return 'UEFA'; // safe default
}

function mapFixtureStatus(short) {
  const FINISHED = new Set(['FT','AET','PEN','AWD','WO','CANC']);
  const IN_PLAY  = new Set(['1H','HT','2H','ET','BT','P','INT','LIVE']);
  if (FINISHED.has(short)) return 'finished';
  if (IN_PLAY.has(short))  return 'in_play';
  return 'scheduled';
}

module.exports = {
  syncLeagues,
  syncClubs,
  syncPlayers,
  syncFixtures,
  syncRatings,
  syncInjuries,
  syncStatsBombEvents,
  preWarmCache,
  syncAll,
};

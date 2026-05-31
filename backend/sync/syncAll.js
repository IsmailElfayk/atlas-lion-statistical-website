/**
 * syncAll — orchestrates the full football-data.org ingestion pipeline.
 *
 * Steps:
 *   1. syncLeagues  —  1 API req
 *   2. syncClubs    — 12 API req
 *   3. syncMatches  — 12 API req
 *   4. syncPlayers  — ~N req (1 per club); only when includeSquads=true
 *   5. syncRatings  — up to P×35 req, heavily Redis-cached
 *   6. evictCache   — Redis key sweep (no API calls)
 */

const syncLeagues = require('./syncLeagues');
const syncClubs   = require('./syncClubs');
const syncMatches = require('./syncMatches');
const syncPlayers = require('./syncPlayers');
const syncRatings = require('./syncRatings');
const { getRedis } = require('../config/redis');
const SyncLog      = require('../models/SyncLog');

async function evictBestXICache() {
  const redis = getRedis();
  if (!redis) return 0;
  let cursor = 0, deleted = 0;
  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: 'bestxi:*', count: 100 });
      cursor = Number(nextCursor);
      if (keys.length) {
        await Promise.all(keys.map(k => redis.del(k)));
        deleted += keys.length;
      }
    } while (cursor !== 0);
    console.log(`[Sync] evictCache — ${deleted} bestxi:* keys cleared`);
  } catch (err) {
    console.error(`[Sync] evictCache failed: ${err.message}`);
  }
  return deleted;
}

function currentSeason() {
  const y = new Date().getUTCFullYear();
  return new Date().getUTCMonth() + 1 >= 7 ? y : y - 1;
}

/**
 * @param {object}  opts
 * @param {boolean} [opts.includeSquads=true]  Run syncPlayers (expensive — weekly only).
 * @param {boolean} [opts.ratingsOnly=false]   Skip steps 1–4; only run syncRatings + cache eviction.
 */
async function syncAll({ includeSquads = true, ratingsOnly = false } = {}) {
  const SEASON    = process.env.SYNC_SEASON || String(currentSeason());
  const startedAt = new Date();
  const errors    = [];
  const results   = {};

  console.log(`[Sync] ══ START ══ ${startedAt.toISOString()} | season=${SEASON} | includeSquads=${includeSquads} | ratingsOnly=${ratingsOnly}`);

  const stages = ratingsOnly
    ? [
        { name: 'ratings', fn: () => syncRatings() },
        { name: 'cache',   fn: () => evictBestXICache() },
      ]
    : [
        { name: 'leagues',                          fn: () => syncLeagues() },
        { name: 'clubs',                            fn: () => syncClubs(SEASON) },
        { name: 'matches',                          fn: () => syncMatches(SEASON) },
        ...(includeSquads ? [{ name: 'players', fn: () => syncPlayers(SEASON) }] : []),
        { name: 'ratings',                          fn: () => syncRatings() },
        { name: 'cache',                            fn: () => evictBestXICache() },
      ];

  for (const stage of stages) {
    try {
      console.log(`[Sync] ── ${stage.name} ──`);
      results[stage.name] = await stage.fn();
    } catch (err) {
      console.error(`[Sync] ${stage.name} FAILED: ${err.message}`);
      results[stage.name] = { error: err.message };
      errors.push(`${stage.name}: ${err.message}`);
    }
  }

  const finishedAt = new Date();
  const durationMs = finishedAt - startedAt;

  try {
    await SyncLog.create({
      startedAt,
      finishedAt,
      durationMs,
      playersUpserted: typeof results.players === 'number' ? results.players  : 0,
      ratingsUpserted: typeof results.ratings === 'number' ? results.ratings  : 0,
      errors,
    });
  } catch (err) {
    console.error('[Sync] Failed to save SyncLog:', err.message);
  }

  console.log(`[Sync] ══ COMPLETE ══ ${(durationMs / 60_000).toFixed(1)} min`);
  console.log(JSON.stringify({ ...results, errors }, null, 2));
  return { ...results, errors, durationMs };
}

module.exports = { syncAll, evictBestXICache };

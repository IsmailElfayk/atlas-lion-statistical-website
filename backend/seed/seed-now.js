/**
 * seed-now.js — fast targeted seed for an already-bootstrapped DB.
 *
 * Skips syncLeagues + syncClubs (already done — 12 leagues, 166 clubs in DB).
 * Runs: syncPlayers (12 req) → syncMatches (12 req) → syncRatings (1 req/player).
 *
 * Rate limit: 10 req / 11 min — auto-handled by footballDataClient.
 * Estimated: ~30–40 Moroccan players → ~65 API req → ~1.5 h total.
 *
 * Usage:
 *   cd backend && node seed/seed-now.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB    = require('../config/db');
const { connectRedis } = require('../config/redis');
const syncPlayers  = require('../sync/syncPlayers');
const syncMatches  = require('../sync/syncMatches');
const syncRatings  = require('../sync/syncRatings');
const { evictBestXICache } = require('../sync/syncAll');
const SyncLog      = require('../models/SyncLog');

async function run() {
  await connectDB();
  connectRedis();

  const SEASON = process.env.SYNC_SEASON || (() => {
    const y = new Date().getUTCFullYear();
    return new Date().getUTCMonth() + 1 >= 7 ? String(y) : String(y - 1);
  })();

  console.log('\n════════════════════════════════════════════════');
  console.log(' Atlas Lions — Targeted Seed (players + ratings)');
  console.log('════════════════════════════════════════════════');
  console.log(' Season :', SEASON, '(2025-26)');
  console.log(' Mode   : heuristic (no Redis) or full events (Redis)');
  console.log(' Steps  : syncPlayers → syncMatches → syncRatings → cache evict');
  console.log('════════════════════════════════════════════════\n');

  const startedAt = new Date();
  const errors = [];
  const results = {};

  const stages = [
    { name: 'players', fn: () => syncPlayers(SEASON) },
    { name: 'matches', fn: () => syncMatches(SEASON) },
    { name: 'ratings', fn: () => syncRatings() },
    { name: 'cache',   fn: () => evictBestXICache() },
  ];

  for (const stage of stages) {
    console.log(`\n── ${stage.name.toUpperCase()} ─────────────────────────────`);
    try {
      results[stage.name] = await stage.fn();
    } catch (err) {
      console.error(`✗ ${stage.name} FAILED:`, err.message);
      errors.push(`${stage.name}: ${err.message}`);
      results[stage.name] = { error: err.message };
    }
  }

  const finishedAt = new Date();
  const durationMs = finishedAt - startedAt;

  await SyncLog.create({
    startedAt, finishedAt, durationMs,
    playersUpserted: typeof results.players === 'number' ? results.players : 0,
    ratingsUpserted: typeof results.ratings === 'number' ? results.ratings : 0,
    errors,
  }).catch(() => {});

  console.log('\n════════════════════════════════════════════════');
  console.log(' DONE');
  console.log('  Players :', results.players ?? 0);
  console.log('  Matches :', results.matches ?? 0);
  console.log('  Ratings :', results.ratings ?? 0);
  console.log('  Duration:', (durationMs / 60_000).toFixed(1), 'min');
  if (errors.length) console.log('  Errors  :', errors.join('; '));
  console.log('════════════════════════════════════════════════\n');
  process.exit(0);
}

run().catch(err => { console.error('[seed-now] Fatal:', err); process.exit(1); });

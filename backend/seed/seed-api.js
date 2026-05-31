/**
 * seed-api.js — populate the database from football-data.org (season 2025-26).
 *
 * Runs the full sync pipeline:
 *   Step 1  syncLeagues  —  1 req
 *   Step 2  syncClubs    — 12 req
 *   Step 3  syncMatches  — 12 req
 *   Step 4  syncPlayers  — 1 req per club (~240 total, rate-limited to 10/11min)
 *   Step 5  syncRatings  — per-player match history (rate-limited, Redis-cached)
 *
 * Rate limit: 10 req / 11 min. The client auto-waits — do not interrupt mid-run.
 * Estimated total time: 4–5 hours (Steps 4–5 dominate).
 *
 * Usage:
 *   cd backend && node seed/seed-api.js
 *
 * To skip squad sync (faster, only leagues/clubs/matches/ratings):
 *   SKIP_SQUADS=true node seed/seed-api.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB    = require('../config/db');
const { connectRedis } = require('../config/redis');
const { syncAll }  = require('../sync/syncAll');

(async () => {
  await connectDB();
  connectRedis();

  const includeSquads = process.env.SKIP_SQUADS !== 'true';

  console.log('');
  console.log('════════════════════════════════════════');
  console.log(' Atlas Lions — Live Data Seed (2025-26)');
  console.log('════════════════════════════════════════');
  console.log('Season     :', process.env.SYNC_SEASON || '2025 (auto)');
  console.log('Squads     :', includeSquads ? 'YES (slow, ~4–5h)' : 'NO  (set SKIP_SQUADS=true to skip)');
  console.log('Rate limit : 10 req / 11 min — client auto-waits');
  console.log('');

  const result = await syncAll({ includeSquads });

  console.log('');
  console.log('════════════════════════════════════════');
  console.log(' Seed complete');
  console.log('  Leagues  :', result.leagues  ?? 0);
  console.log('  Clubs    :', result.clubs    ?? 0);
  console.log('  Matches  :', result.matches  ?? 0);
  console.log('  Players  :', result.players  ?? 0);
  console.log('  Ratings  :', result.ratings  ?? 0);
  console.log('  Duration :', ((result.durationMs || 0) / 60_000).toFixed(1), 'min');
  if (result.errors?.length) {
    console.log('  Errors   :', result.errors.join('; '));
  }
  console.log('════════════════════════════════════════');
  process.exit(0);
})().catch(err => {
  console.error('[seed-api] Fatal:', err);
  process.exit(1);
});

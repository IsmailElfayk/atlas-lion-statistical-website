/**
 * Cron Jobs — Atlas Lions Analytics
 *
 * Schedule:
 *   Every 11 min — process the next data chunk (≤10 API requests).
 *
 * Daily cycle (auto-resets at midnight UTC):
 *   Phase 1 — ratings  : ~65 players × 1 req  = 7 chunks  (77 min)
 *   Phase 2 — matches  : 12 codes × 1 req      = 2 chunks  (22 min)
 *   Phase 3 — players  : 12 codes × 1 req      = 2 chunks  (22 min)
 *   Total               : ~89 req, ~11 chunks, ~2 h → idle until tomorrow
 *
 * Rate-limit safety: footballDataClient.js enforces 10 req / 11 min sliding window.
 * Daily budget:      95 req (syncChunk stops automatically when reached).
 * Concurrency:       chunkRunning flag prevents overlapping executions.
 *
 * Note: node-cron requires a persistent process. On Vercel, trigger via
 * Vercel Cron (vercel.json) pointing at POST /api/sync/chunk instead.
 */

const cron      = require('node-cron');
const syncChunk = require('../sync/syncChunk');

let chunkRunning = false;

async function runChunk() {
  if (chunkRunning) {
    console.log('[Cron] ⏩ Previous chunk still running — skipping this tick');
    return;
  }
  chunkRunning = true;
  console.log(`[Cron] ▶ chunk tick — ${new Date().toISOString()}`);
  try {
    const report = await syncChunk();
    console.log(`[Cron] ✓ chunk done — status=${report.status} req=${report.requestsMade ?? 0} today=${report.requestsToday ?? '?'}`);
  } catch (err) {
    console.error('[Cron] ✗ chunk failed:', err.message);
  } finally {
    chunkRunning = false;
  }
}

function startCronJobs() {
  // Every 11 min — process next chunk of ≤10 API requests
  // Pattern fires at :00, :11, :22, :33, :44, :55 within each hour.
  // The rate limiter in footballDataClient handles the :55→:00 (5-min) edge case.
  cron.schedule('*/11 * * * *', runChunk, { timezone: 'UTC' });

  console.log('[Cron] Scheduled: chunk every 11 min (UTC)');
  console.log('[Cron] Daily cycle: ratings → matches → players → done (resets at midnight UTC)');
  console.log('[Cron] Budget: 95 req/day | Chunk: 10 req/chunk | Full cycle: ~2 h');
}

module.exports = { startCronJobs };

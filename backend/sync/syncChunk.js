/**
 * syncChunk — processes the next batch of ≤10 API requests.
 *
 * Called every 11 min by cronJobs.js. Tracks daily progress in SyncProgress.
 *
 * Phase order (priority):
 *   1. ratings  — 1 req/player (~65 players → 7 chunks of 10)
 *   2. matches  — 1 req/competition code (12 codes → 2 chunks)
 *   3. players  — 1 req/competition code (12 codes → 2 chunks)
 *   4. done     — waits until next UTC day resets progress
 *
 * Daily budget: 95 req (safety margin under free-tier 100/day limit).
 * Full cycle:   ~89 req, 11 chunks × 11 min ≈ 2 h, then idle until midnight.
 */

const syncMatches  = require('./syncMatches');
const syncPlayers  = require('./syncPlayers');
const syncRatings  = require('./syncRatings');
const { evictBestXICache } = require('./syncAll');
const SyncProgress = require('../models/SyncProgress');
const fd           = require('../services/footballDataClient');

const CHUNK_SIZE    = 10;          // max API requests per chunk (= rate-limit window size)
const DAILY_BUDGET  = 95;          // stop before hitting free-tier 100/day limit
const MIN_INTERVAL  = 10 * 60_000; // 10 min minimum between chunks (prevents concurrent Vercel invocations)
const PHASE_ORDER   = ['ratings', 'matches', 'players', 'done'];
const TOTAL_CODES  = fd.FREE_TIER_CODES.length; // 12

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function currentSeason() {
  const y = new Date().getUTCFullYear();
  return new Date().getUTCMonth() + 1 >= 7 ? String(y) : String(y - 1);
}

function nextPhase(phase) {
  const idx = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
}

async function getOrCreateProgress() {
  const today = todayUTC();
  let p = await SyncProgress.findOne({ date: today });
  if (!p) {
    await SyncProgress.deleteMany({});
    p = await SyncProgress.create({
      date:          today,
      currentPhase:  'ratings',
      phaseIndex:    0,
      requestsToday: 0,
      written:       { ratings: 0, matches: 0, players: 0 },
    });
    console.log(`[Chunk] ↻ New day — progress reset for ${today}`);
  }
  return p;
}

async function syncChunk() {
  const progress = await getOrCreateProgress();
  const { currentPhase, phaseIndex, requestsToday } = progress;

  if (currentPhase === 'done') {
    console.log(`[Chunk] ✓ All phases done for ${progress.date} — next cycle tomorrow`);
    return { status: 'done', date: progress.date };
  }

  // Guard against concurrent Vercel invocations double-spending quota
  if (progress.lastChunkAt) {
    const msSince = Date.now() - new Date(progress.lastChunkAt).getTime();
    if (msSince < MIN_INTERVAL) {
      console.log(`[Chunk] ⏩ Last chunk ran ${Math.round(msSince / 60_000)} min ago — skipping`);
      return { status: 'too_soon', minutesAgo: Math.round(msSince / 60_000) };
    }
  }

  if (requestsToday >= DAILY_BUDGET) {
    console.log(`[Chunk] ⛔ Daily budget reached (${requestsToday}/${DAILY_BUDGET}) — pausing until tomorrow`);
    return { status: 'budget_exceeded', requestsToday };
  }

  // How many requests can we make this chunk?
  const allowed = Math.min(CHUNK_SIZE, DAILY_BUDGET - requestsToday);
  const season  = currentSeason();

  let written       = 0;
  let requestsMade  = 0;

  console.log(`[Chunk] ▶ phase=${currentPhase} index=${phaseIndex} budget=${requestsToday}/${DAILY_BUDGET} — ${new Date().toISOString()}`);

  if (currentPhase === 'ratings') {
    const result = await syncRatings({ startIndex: phaseIndex, limit: allowed });
    written      = result.written;
    requestsMade = result.processed;

  } else if (currentPhase === 'matches') {
    written      = await syncMatches(season, { startIndex: phaseIndex, limit: allowed });
    requestsMade = Math.min(allowed, TOTAL_CODES - phaseIndex);

  } else if (currentPhase === 'players') {
    written      = await syncPlayers(season, { startIndex: phaseIndex, limit: allowed });
    requestsMade = Math.min(allowed, TOTAL_CODES - phaseIndex);
  }

  const newIndex        = phaseIndex + requestsMade;
  const newRequestsToday = requestsToday + requestsMade;

  // Phase is exhausted when:
  //   ratings  → got fewer players than we asked for (list is shorter than chunk)
  //   matches / players → we've processed all competition codes
  const phaseExhausted =
    (currentPhase === 'ratings'  && requestsMade < allowed) ||
    (['matches', 'players'].includes(currentPhase) && newIndex >= TOTAL_CODES);

  const newPhase = phaseExhausted ? nextPhase(currentPhase) : currentPhase;

  // Persist progress
  const updateFields = {
    currentPhase:  newPhase,
    phaseIndex:    phaseExhausted ? 0 : newIndex,
    requestsToday: newRequestsToday,
    lastChunkAt:   new Date(),
  };
  if (currentPhase === 'ratings') updateFields['written.ratings'] = (progress.written.ratings || 0) + written;
  if (currentPhase === 'matches') updateFields['written.matches'] = (progress.written.matches || 0) + written;
  if (currentPhase === 'players') updateFields['written.players'] = (progress.written.players || 0) + written;

  await SyncProgress.findOneAndUpdate({ date: progress.date }, { $set: updateFields });

  // When transitioning to 'done', evict Best XI cache so fresh data is served
  if (phaseExhausted && newPhase === 'done') {
    await evictBestXICache().catch(() => {});
    console.log('[Chunk] ✓ All phases complete — Best XI cache evicted');
  } else if (phaseExhausted) {
    console.log(`[Chunk] ✓ ${currentPhase} done → advancing to ${newPhase}`);
  }

  console.log(`[Chunk] ↩ written=${written} req=${requestsMade} totalToday=${newRequestsToday}`);

  return {
    status:        'ok',
    phase:         currentPhase,
    phaseExhausted,
    nextPhase:     newPhase,
    requestsMade,
    written,
    requestsToday: newRequestsToday,
  };
}

module.exports = syncChunk;

const { Router } = require('express');
const axios      = require('axios');

const { syncAll, evictBestXICache } = require('../sync/syncAll');
const syncLeagues = require('../sync/syncLeagues');
const syncClubs   = require('../sync/syncClubs');
const syncMatches = require('../sync/syncMatches');
const syncPlayers = require('../sync/syncPlayers');
const syncRatings = require('../sync/syncRatings');
const syncChunk   = require('../sync/syncChunk');
const SyncProgress = require('../models/SyncProgress');

// StatsBomb sync is independent — uses public GitHub CDN, no football-data.org quota
const { syncStatsBombEvents } = require('../services/ingestionService');

const { getRateLimitStatus } = require('../services/footballDataClient');
const SyncLog = require('../models/SyncLog');

const router = Router();

// ── Auth guard: all /api/sync/* routes require X-Sync-Secret ─────────────────
router.use((req, res, next) => {
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return res.status(503).json({ data: null, meta: {}, error: 'SYNC_SECRET not configured' });
  }
  if (req.headers['x-sync-secret'] !== secret) {
    return res.status(401).json({ data: null, meta: {}, error: 'Unauthorised' });
  }
  next();
});

function syncHandler(fn, label) {
  return async (req, res) => {
    const t0 = Date.now();
    try {
      const result = await fn();
      res.json({ data: { [label]: result }, meta: { durationMs: Date.now() - t0 }, error: null });
    } catch (err) {
      console.error(`[Sync] ${label} error:`, err);
      res.status(500).json({ data: null, meta: { durationMs: Date.now() - t0 }, error: err.message });
    }
  };
}

// ── GET /status — rate-limiter state + daily progress + latest SyncLog ───────
router.get('/status', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const [rateLimit, lastSync, progress] = await Promise.all([
    Promise.resolve(getRateLimitStatus()),
    SyncLog.findOne().sort({ startedAt: -1 }).lean(),
    SyncProgress.findOne({ date: today }).lean(),
  ]);
  res.json({
    data: {
      rateLimit,
      dailyProgress: progress
        ? {
            date:          progress.date,
            currentPhase:  progress.currentPhase,
            phaseIndex:    progress.phaseIndex,
            requestsToday: progress.requestsToday,
            written:       progress.written,
            lastChunkAt:   progress.lastChunkAt,
          }
        : null,
      lastSync: lastSync
        ? {
            startedAt:       lastSync.startedAt,
            finishedAt:      lastSync.finishedAt,
            durationMs:      lastSync.durationMs,
            playersUpserted: lastSync.playersUpserted,
            ratingsUpserted: lastSync.ratingsUpserted,
            errors:          lastSync.errors,
          }
        : null,
    },
    meta:  {},
    error: null,
  });
});

// ── POST /chunk — manually trigger one chunk (≤10 req) ────────────────────────
router.post('/chunk', syncHandler(syncChunk, 'chunk'));

// ── /test — verify football-data.org key and quota ───────────────────────────
router.post('/test', async (req, res) => {
  const t0 = Date.now();
  try {
    const r = await axios.get('https://api.football-data.org/v4/competitions', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
      timeout: 10_000,
    });
    res.json({
      data: {
        count:        r.data?.count,
        competitions: (r.data?.competitions || []).map(c => ({ code: c.code, name: c.name })),
      },
      meta:  { durationMs: Date.now() - t0 },
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      data:  null,
      meta:  { durationMs: Date.now() - t0 },
      error: err.response?.data || err.message,
    });
  }
});

// ── Granular sync routes ──────────────────────────────────────────────────────
router.post('/leagues',  syncHandler(syncLeagues,      'leagues'));
router.post('/clubs',    syncHandler(syncClubs,         'clubs'));
router.post('/fixtures', syncHandler(syncMatches,       'fixtures'));
router.post('/squads',   syncHandler(syncPlayers,       'squads'));
router.post('/players',  syncHandler(syncPlayers,       'players'));  // alias
router.post('/ratings',  syncHandler(syncRatings,       'ratings'));
router.post('/cache',    syncHandler(evictBestXICache,  'cache'));

// StatsBomb open-data sync — no football-data.org requests
router.post('/statsbomb', syncHandler(syncStatsBombEvents, 'statsbomb'));

// ── /all — full pipeline ──────────────────────────────────────────────────────
router.post('/all', async (req, res) => {
  const t0 = Date.now();
  const includeSquads = req.body?.includeSquads !== false;
  try {
    const results = await syncAll({ includeSquads });
    res.json({ data: results, meta: { durationMs: Date.now() - t0 }, error: null });
  } catch (err) {
    console.error('[Sync] syncAll error:', err);
    res.status(500).json({ data: null, meta: {}, error: err.message });
  }
});

// ── /run-now — backward-compat alias ─────────────────────────────────────────
router.post('/run-now', async (req, res) => {
  const t0 = Date.now();
  try {
    const results = await syncAll({ includeSquads: false });
    res.json({ data: results, meta: { durationMs: Date.now() - t0 }, error: null });
  } catch (err) {
    console.error('[Sync] run-now error:', err);
    res.status(500).json({ data: null, meta: {}, error: err.message });
  }
});

module.exports = router;

const { Router } = require('express');
const axios          = require('axios');
const { nightlySync } = require('../services/nightlySync');
const {
  syncLeagues,
  syncClubs,
  syncPlayers,
  syncFixtures,
  syncRatings,
  syncInjuries,
  syncStatsBombEvents,
  preWarmCache,
  syncAll,
} = require('../services/ingestionService');

const router = Router();

// ── Auth guard: all /api/sync/* routes require x-sync-secret ─────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function syncHandler(fn, label) {
  return async (req, res) => {
    const t0 = Date.now();
    try {
      const result = await fn(req.body?.leagueIds, req.body?.season);
      res.json({
        data : { [label]: result },
        meta : { durationMs: Date.now() - t0 },
        error: null,
      });
    } catch (err) {
      console.error(`[Sync] ${label} error:`, err);
      res.status(500).json({
        data : null,
        meta : { durationMs: Date.now() - t0 },
        error: err.message,
      });
    }
  };
}

// ── /test — verify API key + quota (raw axios, no error interceptor) ──────────
router.post('/test', async (req, res) => {
  const t0 = Date.now();
  try {
    const r = await axios.get('https://v3.football.api-sports.io/status', {
      headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY1 },
      timeout: 10_000,
    });
    res.json({ data: r.data, meta: { durationMs: Date.now() - t0 }, error: null });
  } catch (err) {
    res.status(500).json({
      data : null,
      meta : { durationMs: Date.now() - t0 },
      error: err.response?.data || err.message,
    });
  }
});

// ── /run-now — manual trigger for the full nightly sync ──────────────────────
router.post('/run-now', async (req, res) => {
  const t0 = Date.now();
  try {
    const report = await nightlySync();
    res.json({
      data : report,
      meta : { durationMs: Date.now() - t0 },
      error: null,
    });
  } catch (err) {
    console.error('[Sync] run-now error:', err);
    res.status(500).json({
      data : null,
      meta : { durationMs: Date.now() - t0 },
      error: err.message,
    });
  }
});

// ── Legacy granular sync routes (ingestionService) ────────────────────────────
router.post('/leagues',   syncHandler(syncLeagues,        'leagues'));
router.post('/clubs',     syncHandler(syncClubs,          'clubs'));
router.post('/players',   syncHandler(syncPlayers,        'players'));
router.post('/fixtures',  syncHandler(syncFixtures,       'fixtures'));
router.post('/ratings', async (req, res) => {
  const t0 = Date.now();
  try {
    const result = await syncRatings(req.body?.fixtureIds || []);
    res.json({ data: { ratings: result }, meta: { durationMs: Date.now() - t0 }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, meta: { durationMs: Date.now() - t0 }, error: err.message });
  }
});
router.post('/injuries',  syncHandler(syncInjuries,       'injuries'));
router.post('/statsbomb', syncHandler(syncStatsBombEvents, 'statsbomb'));
router.post('/cache',     syncHandler(preWarmCache,        'cache'));

router.post('/all', async (req, res) => {
  const t0 = Date.now();
  try {
    const results = await syncAll();
    res.json({ data: results, meta: { durationMs: Date.now() - t0 }, error: null });
  } catch (err) {
    console.error('[Sync] syncAll error:', err);
    res.status(500).json({ data: null, meta: {}, error: err.message });
  }
});

module.exports = router;

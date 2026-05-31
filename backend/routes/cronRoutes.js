/**
 * cronRoutes — Vercel Cron endpoints.
 *
 * Vercel Cron sends: Authorization: Bearer {CRON_SECRET}
 * where CRON_SECRET is auto-injected by Vercel when crons are configured in vercel.json.
 *
 * For local dev, set CRON_SECRET in .env to test manually:
 *   curl -X POST http://localhost:3001/api/cron/chunk \
 *        -H "Authorization: Bearer <your-CRON_SECRET>"
 *
 * Alternatively, use SYNC_SECRET via the /api/sync/chunk endpoint.
 */

const { Router } = require('express');
const syncChunk  = require('../sync/syncChunk');

const router = Router();

function verifyCronAuth(req, res) {
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is not set (local dev without cron config), reject to avoid open endpoint
  if (!cronSecret) {
    res.status(503).json({ data: null, meta: {}, error: 'CRON_SECRET not configured' });
    return false;
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ data: null, meta: {}, error: 'Unauthorised' });
    return false;
  }

  return true;
}

// POST /api/cron/chunk — triggered by Vercel Cron every 11 min
router.post('/chunk', async (req, res) => {
  if (!verifyCronAuth(req, res)) return;

  const t0 = Date.now();
  try {
    const result = await syncChunk();
    res.json({ data: result, meta: { durationMs: Date.now() - t0 }, error: null });
  } catch (err) {
    console.error('[Cron] /chunk failed:', err.message);
    res.status(500).json({ data: null, meta: { durationMs: Date.now() - t0 }, error: err.message });
  }
});

module.exports = router;

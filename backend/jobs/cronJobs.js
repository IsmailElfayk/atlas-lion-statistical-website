/**
 * Cron Jobs — Atlas Lions Analytics
 *
 * Schedule 1: '0 0 * * *'   00:00 UTC daily     — full nightly sync
 * Schedule 2: '30 0 * * *'  00:30 UTC daily     — safety-net retry if first run had errors
 *                             or upserted fewer than 20 players
 *
 * On Vercel serverless: use Vercel Cron to POST /api/sync/run-now instead.
 */

const cron         = require('node-cron');
const { nightlySync } = require('../services/nightlySync');
const SyncLog      = require('../models/SyncLog');

async function runSync(label) {
  console.log(`[Cron] ▶ ${label} — ${new Date().toISOString()}`);
  try {
    const report = await nightlySync();
    console.log(`[Cron] ✓ ${label} done — players: ${report.playersUpserted}, ratings: ${report.ratingsUpserted}`);
    return report;
  } catch (err) {
    // Never crash the process — log and continue
    console.error(`[Cron] ✗ ${label} failed:`, err.message);
    return null;
  }
}

function startCronJobs() {
  // ── Primary: every day at 00:00 UTC ────────────────────────────────────────
  cron.schedule('0 0 * * *', () => runSync('nightly-sync'), { timezone: 'UTC' });

  // ── Safety net: 00:30 UTC — re-run if primary had errors or low player count
  cron.schedule('30 0 * * *', async () => {
    const midnight = new Date();
    midnight.setUTCHours(0, 0, 0, 0);

    const todayLog = await SyncLog.findOne({ startedAt: { $gte: midnight } })
      .sort({ startedAt: -1 })
      .lean()
      .catch(() => null);

    const needsRetry =
      !todayLog ||
      todayLog.playersUpserted < 20 ||
      (todayLog.errors?.length > 0);

    if (needsRetry) {
      console.log('[Cron] Safety-net triggered — re-running nightly sync');
      await runSync('nightly-sync-retry');
    } else {
      console.log('[Cron] Safety-net: primary sync looks healthy, skipping retry');
    }
  }, { timezone: 'UTC' });

  console.log('[Cron] Nightly sync jobs scheduled (00:00 UTC + 00:30 safety net)');
}

module.exports = { startCronJobs };

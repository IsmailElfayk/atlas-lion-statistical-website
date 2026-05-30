require('dotenv').config();

// ── Startup env guard ──────────────────────────────────────────────────────────
(function checkEnv() {
  // Count how many rotation keys are configured
  let keyCount = 0;
  for (let i = 1; i <= 7; i++) { if (process.env[`API_FOOTBALL_KEY${i}`]) keyCount++; }

  console.log('[Atlas] API_FOOTBALL_KEY1…7 :', keyCount > 0 ? `${keyCount} keys loaded` : 'NONE FOUND ⚠');
  console.log('[Atlas] SYNC_SECRET         :', process.env.SYNC_SECRET   ? 'set' : 'NOT SET ⚠');
  console.log('[Atlas] MONGO_URI           :', process.env.MONGO_URI      ? 'set' : 'NOT SET ⚠');
  console.log('[Atlas] UPSTASH_REDIS       :', process.env.UPSTASH_REDIS_REST_URL ? 'set' : 'not set (caching disabled)');
  const autoSeason = (() => { const n = new Date(); const y = n.getUTCFullYear(); return n.getUTCMonth() + 1 >= 7 ? y : y - 1; })();
  console.log('[Atlas] SYNC_SEASON         :', process.env.SYNC_SEASON || `${autoSeason} (auto-detected)`);
})();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(rateLimiter);

app.use('/api/players',  require('./routes/playerRoutes'));
app.use('/api/lineup',   require('./routes/lineupRoutes'));
app.use('/api/fixtures', require('./routes/fixtureRoutes'));
app.use('/api/leagues',  require('./routes/leagueRoutes'));
app.use('/api/clubs',    require('./routes/clubRoutes'));
app.use('/api/compare',  require('./routes/compareRoutes'));
app.use('/api/meta',     require('./routes/metaRoutes'));
app.use('/api/sync',     require('./routes/syncRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '0.4.1' }));
app.use(errorHandler);

// Connect to MongoDB — mongoose queues requests until connected, safe for serverless
connectDB().catch((err) => console.error('[MongoDB] connection error', err));
connectRedis();

// Cron jobs — only in persistent processes (local dev / dedicated server)
// On Vercel, trigger /api/sync/* via Vercel Cron or an external scheduler instead
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  const { startCronJobs } = require('./jobs/cronJobs');
  startCronJobs();
}

// Export app for Vercel serverless (@vercel/node wraps this automatically)
module.exports = app;

// Only bind a port when running locally (not on Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`[Atlas] API listening on http://localhost:${PORT}`));
}

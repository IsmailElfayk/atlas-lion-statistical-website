require('dotenv').config();
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

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '0.4.1' }));
app.use(errorHandler);

// Connect to MongoDB — mongoose queues requests until connected, safe for serverless
connectDB().catch((err) => console.error('[MongoDB] connection error', err));
connectRedis();

// Export app for Vercel serverless (@vercel/node wraps this automatically)
module.exports = app;

// Only bind a port when running locally (not on Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`[Atlas] API listening on http://localhost:${PORT}`));
}

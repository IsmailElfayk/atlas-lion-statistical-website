const { Redis } = require('@upstash/redis');

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('[Redis] Upstash client initialised');
} else {
  console.warn('[Redis] Upstash env vars not set — caching disabled');
}

// No-op kept so server.js doesn't need changes to its startup sequence
async function connectRedis() {}

function getRedis() { return redis; }

module.exports = { connectRedis, getRedis };

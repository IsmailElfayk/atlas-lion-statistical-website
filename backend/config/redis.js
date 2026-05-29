const { createClient } = require('redis');

let client = null;

async function connectRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  client = createClient({
    url,
    socket: { reconnectStrategy: (retries) => { if (retries >= 1) { client = null; return new Error('Redis unavailable'); } return 500; } },
  });
  client.on('error', () => {});
  try {
    await client.connect();
    console.log('[Redis] Connected to', url);
  } catch {
    console.warn('[Redis] Unavailable — caching disabled');
    client = null;
  }
}

function getRedis() { return client; }

module.exports = { connectRedis, getRedis };

const { getRedis } = require('../config/redis');

function cacheMiddleware(ttl = 3600) {
  return async (req, res, next) => {
    const redis = getRedis();
    if (!redis) return next();
    const key = `cache:${req.originalUrl}`;
    try {
      const cached = await redis.get(key);
      if (cached !== null) {
        res.setHeader('X-Cache', 'HIT');
        // Upstash auto-deserialises — cached is already an object
        return res.json(cached);
      }
    } catch { /* skip on error */ }

    const origJson = res.json.bind(res);
    res.json = (body) => {
      // Upstash uses set(key, value, { ex: ttl }) — not setEx
      redis.set(key, body, { ex: ttl }).catch(() => {});
      res.setHeader('X-Cache', 'MISS');
      return origJson(body);
    };
    next();
  };
}

module.exports = cacheMiddleware;

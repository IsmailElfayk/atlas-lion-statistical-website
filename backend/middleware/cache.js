const { getRedis } = require('../config/redis');

function cacheMiddleware(ttl = 3600) {
  return async (req, res, next) => {
    const redis = getRedis();
    if (!redis) return next();
    const key = `cache:${req.originalUrl}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch { /* skip on error */ }

    const origJson = res.json.bind(res);
    res.json = (body) => {
      redis.setEx(key, ttl, JSON.stringify(body)).catch(() => {});
      res.setHeader('X-Cache', 'MISS');
      return origJson(body);
    };
    next();
  };
}

module.exports = cacheMiddleware;

const { getWindowScores } = require('../services/ratingService');
const { optimize } = require('../services/lineupService');
const { ok, fail } = require('../utils/apiResponse');
const { getRedis } = require('../config/redis');

async function getBestXI(req, res) {
  const {
    formation = '4-3-3',
    window: windowDays = 30,
    buckets,
    ratingMethod = 'commercial',
    minMinutes = 90,
  } = req.query;

  const bucketsArr = buckets ? (Array.isArray(buckets) ? buckets : buckets.split(',')) : ['big5','other_europe','botola'];

  const cacheKey = `bestxi:${formation}:${windowDays}:${bucketsArr.sort().join(',')}:${ratingMethod}:${minMinutes}`;
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch { /* skip */ }
  }

  let candidates = await getWindowScores({ window: +windowDays, buckets: bucketsArr, ratingMethod, minMinutes: +minMinutes });

  let relaxed = false;
  if (candidates.length < 11) {
    candidates = await getWindowScores({ window: +windowDays, buckets: bucketsArr, ratingMethod, minMinutes: 0 });
    relaxed = true;
  }

  const result = await optimize({ formation, candidates });

  const response = {
    data: result,
    meta: { candidateCount: candidates.length, relaxedMinMinutes: relaxed, window: +windowDays, buckets: bucketsArr, ratingMethod },
    error: null,
  };

  if (redis) redis.setEx(cacheKey, 3600, JSON.stringify(response)).catch(() => {});
  res.json(response);
}

module.exports = { getBestXI };

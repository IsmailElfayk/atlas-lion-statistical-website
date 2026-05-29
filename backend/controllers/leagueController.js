const League = require('../models/League');
const { ok } = require('../utils/apiResponse');

async function getLeagues(req, res) {
  const filter = {};
  if (req.query.bucket) filter.bucket = req.query.bucket;
  const leagues = await League.find(filter).sort({ name: 1 }).lean();
  ok(res, leagues);
}

module.exports = { getLeagues };

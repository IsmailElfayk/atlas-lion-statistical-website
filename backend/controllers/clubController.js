const Club = require('../models/Club');
const { ok } = require('../utils/apiResponse');

async function getClubs(req, res) {
  const filter = {};
  if (req.query.league) filter.league = req.query.league;
  const clubs = await Club.find(filter).populate('league').sort({ name: 1 }).lean();
  ok(res, clubs);
}

module.exports = { getClubs };

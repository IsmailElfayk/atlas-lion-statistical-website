const Match = require('../models/Match');
const League = require('../models/League');
const { ok } = require('../utils/apiResponse');

async function getFixtures(req, res) {
  const { buckets, from, to, playerId } = req.query;
  const bucketsArr = buckets ? (Array.isArray(buckets) ? buckets : buckets.split(',')) : null;

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  else dateFilter.$gte = new Date();
  if (to) dateFilter.$lte = new Date(to);
  else {
    const end = new Date(); end.setDate(end.getDate() + 30);
    dateFilter.$lte = end;
  }

  const matchFilter = { kickoffUtc: dateFilter };
  if (playerId) matchFilter.moroccansPlaying = playerId;

  let matches = await Match.find(matchFilter)
    .populate({ path: 'league' })
    .populate({ path: 'homeClub', populate: { path: 'league' } })
    .populate({ path: 'awayClub', populate: { path: 'league' } })
    .populate({ path: 'moroccansPlaying', select: 'fullName slug' })
    .sort({ kickoffUtc: 1 }).lean();

  if (bucketsArr) {
    matches = matches.filter(m => bucketsArr.includes(m.league?.bucket));
  }

  // Group by date
  const grouped = {};
  matches.forEach(m => {
    const date = m.kickoffUtc ? new Date(m.kickoffUtc).toISOString().slice(0, 10) : 'Unknown';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(m);
  });

  const result = Object.entries(grouped).map(([date, fixtures]) => ({ date, fixtures }));
  ok(res, result, { total: matches.length });
}

module.exports = { getFixtures };

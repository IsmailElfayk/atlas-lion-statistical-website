const Player = require('../models/Player');
const Rating = require('../models/Rating');
const { getPlayerRating, getAllWindowAverages } = require('../services/ratingService');
const { ok, fail } = require('../utils/apiResponse');

const POPULATE = [{ path: 'currentClub', populate: { path: 'league' } }];

async function listPlayers(req, res) {
  const { position, league, bucket, club, ageMax, search, page = 1, limit = 30 } = req.query;
  const filter = {};

  if (position) filter.primaryPosition = position;
  if (club) filter.currentClub = club;
  if (ageMax) filter.age = { $lte: parseInt(ageMax) };
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { fullNameAr: { $regex: search, $options: 'i' } },
    ];
  }

  let query = Player.find(filter).populate(POPULATE);

  // Post-filter by league bucket (needs populate first)
  const total = await Player.countDocuments(filter);
  let players = await query.sort({ fullName: 1 }).lean();

  if (bucket) players = players.filter(p => p.currentClub?.league?.bucket === bucket);
  if (league) players = players.filter(p => p.currentClub?.league?._id?.toString() === league);

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginated = players.slice(skip, skip + parseInt(limit));

  // Attach latest rating + dataQuality per player
  const playerIds = paginated.map(p => p._id);
  const ratingDocs = await Rating.aggregate([
    { $match: { player: { $in: playerIds } } },
    { $sort: { matchDate: -1 } },
    { $group: {
      _id:              '$player',
      performanceScore: { $first: '$performanceScore' },
      sofascoreRating:  { $first: '$sofascoreRating' },
      normalisedCustom: { $first: '$normalisedCustom' },
      fotmobRating:     { $first: '$fotmobRating' },
      dataQuality:      { $first: '$dataQuality' },
    }},
  ]);
  const ratingMap = {};
  ratingDocs.forEach(r => {
    const latestRating =
      r.performanceScore ?? r.sofascoreRating ?? r.normalisedCustom ?? r.fotmobRating ?? null;
    ratingMap[r._id.toString()] = { latestRating, dataQuality: r.dataQuality ?? 'none' };
  });
  const enriched = paginated.map(p => {
    const rm = ratingMap[p._id.toString()] || {};
    return { ...p, latestRating: rm.latestRating ?? null, dataQuality: rm.dataQuality ?? 'none' };
  });

  ok(res, enriched, { total: players.length, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(players.length / parseInt(limit)) });
}

async function getPlayer(req, res) {
  const player = await Player.findOne({ $or: [{ _id: req.params.id.match(/^[0-9a-f]{24}$/i) ? req.params.id : null }, { slug: req.params.id }] }).populate(POPULATE).lean();
  if (!player) return fail(res, 404, 'Player not found');

  // Compute window-averaged ratings in parallel for the performance tab
  const WINDOWS = [15, 30, 45, 60, 75, 90];
  const windowResults = await Promise.all(
    WINDOWS.map(w => getPlayerRating(player._id, w).then(r => [w, r]))
  );
  const windowAverages = Object.fromEntries(windowResults);

  ok(res, { ...player, windowAverages });
}

async function getPlayerRatings(req, res) {
  const { from, to, window: windowDays } = req.query;

  const player = await Player.findOne({
    $or: [
      { _id  : req.params.id.match(/^[0-9a-f]{24}$/i) ? req.params.id : null },
      { slug : req.params.id },
    ],
  });
  if (!player) return fail(res, 404, 'Player not found');

  // ?window=N  → return aggregated stats summary (used by Best XI pipeline)
  if (windowDays) {
    const summary = await getPlayerRating(player._id, parseInt(windowDays));
    return ok(res, summary);
  }

  // Default: return raw rating docs (backward-compatible)
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to)   dateFilter.$lte = new Date(to);

  const ratings = await Rating.find({
    player: player._id,
    ...(Object.keys(dateFilter).length ? { matchDate: dateFilter } : {}),
  })
    .populate({ path: 'match', populate: [{ path: 'homeClub' }, { path: 'awayClub' }, { path: 'league' }] })
    .sort({ matchDate: -1 })
    .lean();

  ok(res, ratings);
}

async function getPlayerAverages(req, res) {
  const player = await Player.findOne({
    $or: [
      { _id  : req.params.id.match(/^[0-9a-f]{24}$/i) ? req.params.id : null },
      { slug : req.params.id },
    ],
  });
  if (!player) return fail(res, 404, 'Player not found');

  const windowAverages = await getAllWindowAverages(player._id);
  ok(res, { playerId: player._id, slug: player.slug, windowAverages });
}

module.exports = { listPlayers, getPlayer, getPlayerRatings, getPlayerAverages };

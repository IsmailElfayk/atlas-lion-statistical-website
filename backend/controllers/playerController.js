const Player = require('../models/Player');
const Rating = require('../models/Rating');
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

  ok(res, paginated, { total: players.length, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(players.length / parseInt(limit)) });
}

async function getPlayer(req, res) {
  const player = await Player.findOne({ $or: [{ _id: req.params.id.match(/^[0-9a-f]{24}$/i) ? req.params.id : null }, { slug: req.params.id }] }).populate(POPULATE).lean();
  if (!player) return fail(res, 404, 'Player not found');
  ok(res, player);
}

async function getPlayerRatings(req, res) {
  const { from, to } = req.query;
  const player = await Player.findOne({ $or: [{ _id: req.params.id.match(/^[0-9a-f]{24}$/i) ? req.params.id : null }, { slug: req.params.id }] });
  if (!player) return fail(res, 404, 'Player not found');

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  const ratings = await Rating.find({
    player: player._id,
    ...(Object.keys(dateFilter).length ? { matchDate: dateFilter } : {}),
  }).populate({ path: 'match', populate: [{ path: 'homeClub' }, { path: 'awayClub' }, { path: 'league' }] })
    .sort({ matchDate: 1 }).lean();

  ok(res, ratings);
}

module.exports = { listPlayers, getPlayer, getPlayerRatings };

const Rating = require('../models/Rating');
const Player = require('../models/Player');
const { ok, fail } = require('../utils/apiResponse');

const RADAR_METRICS = ['shooting','passing','dribbling','defending','aerial','pressing','vision','positioning','pace','workRate','leadership','form'];

function mockRadarValues(player, avgRating) {
  // Deterministic but varied values based on position and rating
  const base = (avgRating - 5) / 4; // normalise 5-9 → 0-1
  const pos = player.primaryPosition;
  const seed = player.fullName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (offset) => Math.min(1, Math.max(0, base + Math.sin(seed + offset) * 0.2));

  const attacking = ['LW','RW','ST','SS','CAM','AM'].includes(pos);
  const defending = ['GK','CB','CDM','DM'].includes(pos);
  const midfielder = ['CM','CAM','LM','RM'].includes(pos);
  const fullback = ['LB','RB','LWB','RWB','WB'].includes(pos);

  return {
    shooting:    attacking ? rng(1) + 0.15 : rng(1),
    passing:     midfielder ? rng(2) + 0.1 : rng(2),
    dribbling:   attacking ? rng(3) + 0.1 : rng(3),
    defending:   defending ? rng(4) + 0.15 : (fullback ? rng(4) + 0.05 : rng(4) * 0.6),
    aerial:      defending ? rng(5) + 0.15 : (pos === 'ST' ? rng(5) + 0.1 : rng(5)),
    pressing:    midfielder ? rng(6) + 0.1 : rng(6),
    vision:      midfielder ? rng(7) + 0.12 : rng(7),
    positioning: attacking ? rng(8) + 0.1 : rng(8),
    pace:        (attacking || fullback) ? rng(9) + 0.12 : rng(9),
    workRate:    midfielder ? rng(10) + 0.1 : rng(10),
    leadership:  rng(11),
    form:        base + rng(12) * 0.1,
  };
}

async function comparePlayers(req, res) {
  const { players: playerIds, window: windowDays = 30 } = req.query;
  if (!playerIds) return fail(res, 400, 'players[] required');
  const ids = Array.isArray(playerIds) ? playerIds : playerIds.split(',');
  if (ids.length < 2 || ids.length > 4) return fail(res, 400, '2-4 player IDs required');

  const since = new Date(Date.now() - (parseInt(windowDays) || 30) * 24 * 3600 * 1000);

  const players = await Player.find({ $or: [{ _id: { $in: ids } }, { slug: { $in: ids } }] })
    .populate({ path: 'currentClub', populate: { path: 'league' } }).lean();

  const result = await Promise.all(players.map(async (player) => {
    const ratings = await Rating.find({ player: player._id, matchDate: { $gte: since } }).lean();
    const totalMin = ratings.reduce((s, r) => s + (r.minutes || 0), 0);
    const avgRating = ratings.length
      ? ratings.reduce((s, r) => s + (r.sofascoreRating || 6), 0) / ratings.length
      : player.marketValueEur ? 6.5 : 6.0;

    return {
      player,
      avgRating: Math.round(avgRating * 10) / 10,
      totalMinutes: totalMin,
      matchCount: ratings.length,
      radar: mockRadarValues(player, avgRating),
    };
  }));

  ok(res, result, { metrics: RADAR_METRICS });
}

module.exports = { compareplayers: comparePlayers };

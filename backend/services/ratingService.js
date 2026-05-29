const Rating = require('../models/Rating');
const Player = require('../models/Player');
const Match = require('../models/Match');
const League = require('../models/League');
const POS_TO_SLOTS = require('../utils/positionMapping');

const WINDOW_DAYS = { 15:15, 30:30, 45:45, 60:60, 75:75, 90:90 };

async function getWindowScores({ window: windowDays, buckets, ratingMethod, minMinutes }) {
  const days = WINDOW_DAYS[windowDays] || 30;
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);

  // Find leagues in the requested buckets
  const leagueQuery = buckets && buckets.length ? { bucket: { $in: buckets } } : {};
  const leagues = await League.find(leagueQuery).select('_id');
  const leagueIds = leagues.map(l => l._id);

  // Find matches in window with those leagues
  const matches = await Match.find({
    kickoffUtc: { $gte: since },
    ...(leagueIds.length ? { league: { $in: leagueIds } } : {}),
  }).select('_id kickoffUtc league');
  const matchIds = matches.map(m => m._id);
  const matchDateMap = {};
  matches.forEach(m => { matchDateMap[m._id.toString()] = m.kickoffUtc; });

  if (!matchIds.length) return [];

  // Aggregate ratings per player
  const ratings = await Rating.find({ match: { $in: matchIds } })
    .populate({ path: 'player', populate: { path: 'currentClub', populate: { path: 'league' } } });

  // Group by player
  const byPlayer = {};
  ratings.forEach(r => {
    if (!r.player) return;
    const pid = r.player._id.toString();
    if (!byPlayer[pid]) byPlayer[pid] = { player: r.player, ratings: [] };
    byPlayer[pid].ratings.push(r);
  });

  const candidates = [];
  for (const [pid, { player, ratings: pRatings }] of Object.entries(byPlayer)) {
    const totalMinutes = pRatings.reduce((s, r) => s + (r.minutes || 0), 0);
    if (totalMinutes < (minMinutes || 0)) continue;

    // Weighted average by minutes
    let totalWeight = 0, weightedSum = 0;
    let bestQuality = 'none';
    const qualityRank = { event: 3, rating: 2, heuristic: 1, none: 0 };

    for (const r of pRatings) {
      const min = r.minutes || 0;
      let score;
      if (ratingMethod === 'custom' && r.normalisedCustom != null) {
        score = r.normalisedCustom;
      } else if (r.sofascoreRating != null) {
        score = r.sofascoreRating;
      } else if (r.fotmobRating != null) {
        score = r.fotmobRating;
      } else {
        score = 6.0; // heuristic fallback
      }
      weightedSum += score * min;
      totalWeight += min;
      if (qualityRank[r.dataQuality] > qualityRank[bestQuality]) bestQuality = r.dataQuality;
    }

    const avgRating = totalWeight > 0 ? weightedSum / totalWeight : 6.0;

    candidates.push({
      playerId: pid,
      slug: player.slug,
      fullName: player.fullName,
      fullNameAr: player.fullNameAr,
      photoUrl: player.photoUrl,
      primaryPosition: player.primaryPosition,
      eligiblePositions: player.eligiblePositions?.length ? player.eligiblePositions : POS_TO_SLOTS[player.primaryPosition] || [],
      avgRating: Math.round(avgRating * 10) / 10,
      totalMinutes,
      dataQuality: bestQuality,
      club: player.currentClub,
      moroccoEligibility: player.moroccoEligibility,
      status: player.status,
    });
  }

  return candidates.sort((a, b) => b.avgRating - a.avgRating);
}

module.exports = { getWindowScores };

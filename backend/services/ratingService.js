const Rating = require('../models/Rating');
const Player = require('../models/Player');
const Match  = require('../models/Match');
const League = require('../models/League');
const POS_TO_SLOTS = require('../utils/positionMapping');

const WINDOW_DAYS  = [15, 30, 45, 60, 75, 90];
const QUALITY_RANK = { event: 3, rating: 2, heuristic: 1, none: 0 };

// Score fallback chain: performanceScore → sofascoreRating → normalisedCustom → 6.0
function pickScore(r) {
  if (r.performanceScore != null) return { score: r.performanceScore, quality: 'event' };
  if (r.sofascoreRating  != null) return { score: r.sofascoreRating,  quality: 'rating' };
  if (r.normalisedCustom != null) return { score: r.normalisedCustom, quality: 'rating' };
  if (r.fotmobRating     != null) return { score: r.fotmobRating,     quality: 'rating' };
  return { score: 6.0, quality: 'heuristic' };
}

// ── Core single-player window aggregate ──────────────────────────────────────

async function getPlayerRating(playerId, windowDays = 30) {
  const days  = WINDOW_DAYS.includes(windowDays) ? windowDays : 30;
  const since = new Date(Date.now() - days * 24 * 3600_000);

  const ratings = await Rating.find({ player: playerId, matchDate: { $gte: since } }).lean();

  let weightedSum = 0, totalWeight = 0, bestQuality = 'none';

  for (const r of ratings) {
    if (QUALITY_RANK[r.dataQuality] > QUALITY_RANK[bestQuality]) bestQuality = r.dataQuality;
    const { score, quality } = pickScore(r);
    if (QUALITY_RANK[quality] > QUALITY_RANK[bestQuality]) bestQuality = quality;
    const min = r.minutes || 0;
    weightedSum += score * min;
    totalWeight += min;
  }

  const avgRating    = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null;
  const totalMinutes = ratings.reduce((s, r) => s + (r.minutes || 0), 0);

  return { avgRating, totalMinutes, matchCount: ratings.length, dataQuality: bestQuality, window: days };
}

// ── All six windows for a single player ──────────────────────────────────────

async function getAllWindowAverages(playerId) {
  const results = await Promise.all(WINDOW_DAYS.map(w => getPlayerRating(playerId, w)));
  return Object.fromEntries(WINDOW_DAYS.map((w, i) => [w, results[i]]));
}

// ── Cross-player candidates (used by lineup optimizer) ────────────────────────

async function getWindowScores({ window: windowDays, buckets, ratingMethod, minMinutes }) {
  return getRankedCandidates({ windowDays, buckets, ratingMethod, minMinutes });
}

async function getRankedCandidates({ windowDays = 30, buckets, ratingMethod, minMinutes = 0 } = {}) {
  const days  = WINDOW_DAYS.includes(Number(windowDays)) ? Number(windowDays) : 30;
  const since = new Date(Date.now() - days * 24 * 3600_000);

  const leagueQuery = buckets && buckets.length ? { bucket: { $in: buckets } } : {};
  const leagues     = await League.find(leagueQuery).select('_id');
  const leagueIds   = leagues.map(l => l._id);

  const matches = await Match.find({
    kickoffUtc: { $gte: since },
    ...(leagueIds.length ? { league: { $in: leagueIds } } : {}),
  }).select('_id kickoffUtc');
  const matchIds = matches.map(m => m._id);

  if (!matchIds.length) return [];

  const ratings = await Rating.find({ match: { $in: matchIds } })
    .populate({ path: 'player', populate: { path: 'currentClub', populate: { path: 'league' } } });

  const byPlayer = {};
  for (const r of ratings) {
    if (!r.player) continue;
    const pid = r.player._id.toString();
    if (!byPlayer[pid]) byPlayer[pid] = { player: r.player, ratings: [] };
    byPlayer[pid].ratings.push(r);
  }

  const candidates = [];
  for (const { player, ratings: pRatings } of Object.values(byPlayer)) {
    const totalMinutes = pRatings.reduce((s, r) => s + (r.minutes || 0), 0);
    if (totalMinutes < minMinutes) continue;

    let weightedSum = 0, totalWeight = 0, bestQuality = 'none';
    for (const r of pRatings) {
      const { score, quality } = pickScore(r);
      if (QUALITY_RANK[quality] > QUALITY_RANK[bestQuality]) bestQuality = quality;
      const min = r.minutes || 0;
      weightedSum += score * min;
      totalWeight += min;
    }

    const avgRating = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 6.0;

    candidates.push({
      playerId:          player._id.toString(),
      slug:              player.slug,
      fullName:          player.fullName,
      fullNameAr:        player.fullNameAr,
      photoUrl:          player.photoUrl,
      primaryPosition:   player.primaryPosition,
      eligiblePositions: player.eligiblePositions?.length
        ? player.eligiblePositions
        : POS_TO_SLOTS[player.primaryPosition] || [],
      avgRating,
      totalMinutes,
      dataQuality:       bestQuality,
      club:              player.currentClub,
      moroccoEligibility: player.moroccoEligibility,
      status:            player.status,
    });
  }

  return candidates.sort((a, b) => b.avgRating - a.avgRating);
}

module.exports = { getWindowScores, getRankedCandidates, getPlayerRating, getAllWindowAverages };

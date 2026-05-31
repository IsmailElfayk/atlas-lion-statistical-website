const fd     = require('../services/footballDataClient');
const League = require('../models/League');
const Club   = require('../models/Club');
const Match  = require('../models/Match');

function currentSeason() {
  const y = new Date().getUTCFullYear();
  return new Date().getUTCMonth() + 1 >= 7 ? y : y - 1;
}

function mapStatus(fdStatus) {
  if (fdStatus === 'FINISHED') return 'finished';
  if (['IN_PLAY', 'PAUSED', 'HALF_TIME'].includes(fdStatus)) return 'in_play';
  return 'scheduled';
}

async function syncMatches(season = String(currentSeason()), { startIndex = 0, limit = Infinity } = {}) {
  const codes = fd.FREE_TIER_CODES.slice(startIndex, startIndex + limit);
  console.log(`[Sync] syncMatches — ${codes.length} API req`);
  let upserted = 0;

  for (const code of codes) {
    let data;
    try {
      data = await fd.getCompetitionMatches(code, season);
    } catch (err) {
      console.error(`[Sync] syncMatches — API error for ${code}: ${err.message}`);
      continue;
    }

    const leagueDoc = data.competition?.name
      ? await League.findOne({ name: data.competition.name })
      : null;

    for (const match of data.matches || []) {
      const [homeClub, awayClub] = await Promise.all([
        Club.findOne({ apiFootballId: match.homeTeam?.id }),
        Club.findOne({ apiFootballId: match.awayTeam?.id }),
      ]);

      try {
        await Match.findOneAndUpdate(
          { apiFootballId: match.id },
          {
            $set: {
              apiFootballId: match.id,
              kickoffUtc:    new Date(match.utcDate),
              homeScore:     match.score?.fullTime?.home ?? undefined,
              awayScore:     match.score?.fullTime?.away ?? undefined,
              status:        mapStatus(match.status),
              competition:   data.competition?.name || '',
              season:        String(season),
              ...(leagueDoc && { league:   leagueDoc._id }),
              ...(homeClub  && { homeClub: homeClub._id }),
              ...(awayClub  && { awayClub: awayClub._id }),
            },
            $setOnInsert: { moroccansPlaying: [] },
          },
          { upsert: true, new: true }
        );
        upserted++;
      } catch (err) {
        console.error(`[Sync] syncMatches — failed for match ${match.id}: ${err.message}`);
      }
    }
  }

  console.log(`[Sync] syncMatches — ${upserted} upserted`);
  return upserted;
}

module.exports = syncMatches;

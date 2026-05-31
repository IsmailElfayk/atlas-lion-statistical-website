const fd     = require('../services/footballDataClient');
const League = require('../models/League');
const Club   = require('../models/Club');

function currentSeason() {
  const y = new Date().getUTCFullYear();
  return new Date().getUTCMonth() + 1 >= 7 ? y : y - 1;
}

async function syncClubs(season = String(currentSeason())) {
  console.log(`[Sync] syncClubs — ${fd.FREE_TIER_CODES.length} API req`);
  let upserted = 0;

  for (const code of fd.FREE_TIER_CODES) {
    let data;
    try {
      data = await fd.getCompetitionTeams(code, season);
    } catch (err) {
      console.error(`[Sync] syncClubs — API error for ${code}: ${err.message}`);
      continue;
    }

    const leagueDoc = data.competition?.name
      ? await League.findOne({ name: data.competition.name })
      : null;

    for (const team of data.teams || []) {
      try {
        await Club.findOneAndUpdate(
          { apiFootballId: team.id },
          {
            $set: {
              apiFootballId: team.id,
              name:          team.name,
              shortName:     team.shortName || team.tla || team.name.slice(0, 6).toUpperCase(),
              country:       team.area?.name || leagueDoc?.country || null,
              logoUrl:       team.crest || null,
              ...(leagueDoc && { league: leagueDoc._id }),
            },
          },
          { upsert: true, new: true }
        );
        upserted++;
      } catch (err) {
        console.error(`[Sync] syncClubs — failed for ${team.name}: ${err.message}`);
      }
    }
  }

  console.log(`[Sync] syncClubs — ${upserted} upserted`);
  return upserted;
}

module.exports = syncClubs;

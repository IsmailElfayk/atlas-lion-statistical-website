/**
 * syncPlayers — detect and upsert Moroccan players.
 *
 * Uses getCompetitionTeams() (the same 12 req as syncClubs) instead of
 * individual getTeam() calls per club (~240 req).
 * The competition-teams response includes full squad arrays with nationality,
 * so Moroccan detection is done in 12 API calls total.
 * When Redis is configured, those 12 calls hit the 23h cache → 0 extra req.
 *
 * Detection is purely API-based: nationality === "Morocco".
 * No hardcoded player list.
 */

const fd                    = require('../services/footballDataClient');
const { normalizePosition } = require('../utils/positionNormalizer');
const League = require('../models/League');
const Club   = require('../models/Club');
const Player = require('../models/Player');

function toSlug(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function currentSeason() {
  const y = new Date().getUTCFullYear();
  return new Date().getUTCMonth() + 1 >= 7 ? y : y - 1;
}

async function syncPlayers(season = String(currentSeason()), { startIndex = 0, limit = Infinity } = {}) {
  const codes = fd.FREE_TIER_CODES.slice(startIndex, startIndex + limit);
  console.log(`[Sync] syncPlayers — ${codes.length} API req (squad data embedded in competition-teams response)`);
  let upserted = 0;
  let totalFound = 0;

  for (const code of codes) {
    let data;
    try {
      data = await fd.getCompetitionTeams(code, season);
    } catch (err) {
      console.error(`[Sync] syncPlayers — API error for ${code}: ${err.message}`);
      continue;
    }

    const leagueDoc = data.competition?.name
      ? await League.findOne({ name: data.competition.name })
      : null;

    for (const team of data.teams || []) {
      // Resolve club doc (should already exist from syncClubs)
      let clubDoc = await Club.findOne({ apiFootballId: team.id });
      if (!clubDoc) {
        // Create on the fly if syncClubs hasn't run yet
        try {
          clubDoc = await Club.findOneAndUpdate(
            { apiFootballId: team.id },
            {
              $set: {
                apiFootballId: team.id,
                name:          team.name,
                shortName:     team.shortName || team.tla || team.name.slice(0, 6).toUpperCase(),
                country:       team.area?.name || null,
                logoUrl:       team.crest || null,
                ...(leagueDoc && { league: leagueDoc._id }),
              },
            },
            { upsert: true, new: true }
          );
        } catch { /* non-fatal */ }
      }

      const moroccans = (team.squad || []).filter(p => (p.nationality || '').toLowerCase() === 'morocco');
      if (moroccans.length) {
        console.log(`[Sync] syncPlayers — ${team.name}: ${moroccans.map(p => p.name).join(', ')}`);
        totalFound += moroccans.length;
      }

      for (const person of moroccans) {
        const cleanName = (person.name || '').trim();
        if (!cleanName) continue;

        const slug    = toSlug(cleanName);
        const normPos = normalizePosition(person.position || '');

        try {
          await Player.findOneAndUpdate(
            {
              $or: [
                { 'externalIds.apiFootball': person.id },
                { slug },
              ],
            },
            {
              $set: {
                'externalIds.apiFootball': person.id,
                slug,
                fullName:           cleanName,
                nationalities:      ['Morocco'],
                isMoroccanNational: true,
                lastSyncedAt:       new Date(),
                ...(clubDoc        && { currentClub: clubDoc._id }),
                ...(person.dateOfBirth && { dob: new Date(person.dateOfBirth) }),
                ...(normPos            && { primaryPosition: normPos }),
              },
              $setOnInsert: {
                moroccoEligibility: 'eligible',
                eligiblePositions:  [],
                status:             'available',
                minutesCurrent:     0,
              },
            },
            { upsert: true, new: true }
          );
          upserted++;
        } catch (err) {
          console.error(`[Sync] syncPlayers — failed for ${cleanName}: ${err.message}`);
        }
      }
    }
  }

  console.log(`[Sync] syncPlayers — found ${totalFound} Moroccan players across all competitions, upserted ${upserted}`);
  return upserted;
}

module.exports = syncPlayers;

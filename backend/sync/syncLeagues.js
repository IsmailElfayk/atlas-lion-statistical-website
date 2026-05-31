const fd      = require('../services/footballDataClient');
const League  = require('../models/League');

const CONFEDERATION_BY_CODE = {
  PL:  'UEFA', PD: 'UEFA', BL1: 'UEFA', SA: 'UEFA', FL1: 'UEFA',
  CL:  'UEFA', DED: 'UEFA', ELC: 'UEFA', PPL: 'UEFA', EC: 'UEFA',
  BSA: 'CONMEBOL',
  WC:  'UEFA', // no 'World' enum value — UEFA is the safe fallback
};

const TIER_BY_CODE = {
  PL: 1, PD: 1, BL1: 1, SA: 1, FL1: 1, DED: 1, PPL: 1, BSA: 1,
  CL: 0, EC: 0, WC: 0,
  ELC: 2,
};

async function syncLeagues() {
  console.log('[Sync] syncLeagues — 1 API req');
  const data = await fd.getCompetitions();
  const competitions = data.competitions || [];
  let upserted = 0;

  for (const comp of competitions) {
    const bucket        = fd.COMPETITION_BUCKET[comp.code];
    const confederation = CONFEDERATION_BY_CODE[comp.code] || 'UEFA';
    const tier          = TIER_BY_CODE[comp.code] ?? 1;

    try {
      await League.findOneAndUpdate(
        { name: comp.name },
        {
          $set: {
            name:                comp.name,
            country:             comp.area?.name || 'International',
            bucket,
            confederation,
            tier,
            logoUrl:             comp.emblem || null,
            hasEventData:        false,
            hasSofascoreRatings: false,
          },
          $setOnInsert: { apiFootballId: null },
        },
        { upsert: true, new: true }
      );
      upserted++;
    } catch (err) {
      console.error(`[Sync] syncLeagues — failed for ${comp.name}: ${err.message}`);
    }
  }

  console.log(`[Sync] syncLeagues — ${upserted} upserted`);
  return upserted;
}

module.exports = syncLeagues;

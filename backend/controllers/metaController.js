const formations = require('../utils/formations');
const { ok } = require('../utils/apiResponse');

function getFormations(req, res) {
  ok(res, formations);
}

function getOptions(req, res) {
  ok(res, {
    windows: [15, 30, 45, 60, 75, 90],
    buckets: [
      { key: 'big5',         label: 'Big 5',      leagues: ['Premier League','La Liga','Bundesliga','Serie A','Ligue 1'] },
      { key: 'other_europe', label: 'Other Europe', leagues: ['Eredivisie','Jupiler Pro League','Liga Portugal','Süper Lig'] },
      { key: 'botola',       label: 'Botola Pro',   leagues: ['Botola Pro'] },
      { key: 'mena',         label: 'MENA',         leagues: ['Saudi Pro League','Egyptian Premier League','UAE Pro League','Qatar Stars League'] },
      { key: 'americas',     label: 'Americas',     leagues: ['MLS','Liga MX'] },
      { key: 'world',        label: 'Rest of World', leagues: [] },
    ],
    ratingMethods: [
      { key: 'commercial', label: 'Commercial (Sofascore)', description: 'ML-based match ratings from Sofascore/FotMob' },
      { key: 'custom',     label: 'Custom xT/VAEP',        description: 'Event-based expected threat + valuing actions model. Big 5 + SPL only.' },
    ],
  });
}

module.exports = { getFormations, getOptions };

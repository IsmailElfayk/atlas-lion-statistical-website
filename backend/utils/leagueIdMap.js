// API-Football league ID → our internal bucket string
// https://v3.football.api-sports.io/leagues
const LEAGUE_BUCKET_MAP = {
  // Big 5
  39:  'big5',   // Premier League
  140: 'big5',   // La Liga
  78:  'big5',   // Bundesliga
  135: 'big5',   // Serie A
  61:  'big5',   // Ligue 1

  // Other Europe
  2:   'other_europe', // UEFA Champions League
  3:   'other_europe', // UEFA Europa League
  848: 'other_europe', // UEFA Conference League
  88:  'other_europe', // Eredivisie
  144: 'other_europe', // Jupiler Pro League
  203: 'other_europe', // Süper Lig
  197: 'other_europe', // Super League Greece
  94:  'other_europe', // Primeira Liga (Portugal)
  106: 'other_europe', // Ekstraklasa (Poland)
  271: 'other_europe', // Danish Superliga
  113: 'other_europe', // Allsvenskan
  119: 'other_europe', // Scottish Premiership

  // Morocco
  149: 'botola', // Botola Pro
  840: 'botola', // Botola Pro D2

  // MENA
  307: 'mena',   // Saudi Pro League
  13:  'mena',   // Qatar Stars League
  435: 'mena',   // UAE Pro League
  403: 'mena',   // Egyptian Premier League
  24:  'mena',   // Tunisian Ligue 1

  // Americas
  253: 'americas', // MLS
  262: 'americas', // Liga MX
  71:  'americas', // Brasileirão Série A
  128: 'americas', // Argentine Liga Profesional

  // World / Continental
  1:   'world',  // World Cup
  4:   'world',  // Euro Championship
  6:   'world',  // Africa Cup of Nations (AFCON)
  29:  'world',  // FIFA Friendly
};

// Leagues where Moroccan players are likely present (used for targeted syncs)
const MOROCCO_RELEVANT_LEAGUES = [149, 307, 13, 435, 39, 140, 78, 135, 61, 88, 144, 203, 197, 94, 24, 6, 1];

module.exports = { LEAGUE_BUCKET_MAP, MOROCCO_RELEVANT_LEAGUES };

// Maps position strings → our internal primaryPosition enum.
// Covers both API-Football (coarse + specific) and football-data.org v4 strings.

const POSITION_MAP = {
  // Goalkeepers
  'Goalkeeper':              'GK',

  // Defenders — specific (API-Football + FD shared)
  'Centre-Back':             'CB',
  'Center-Back':             'CB',
  'Right-Back':              'RB',
  'Left-Back':               'LB',
  'Right Wing-Back':         'RWB',
  'Left Wing-Back':          'LWB',
  'Sweeper':                 'CB',

  // Defenders — coarse
  'Defender':                'CB',
  'Defence':                 'CB',   // football-data.org coarse

  // Midfielders — specific API-Football strings
  'Defensive Midfielder':    'CDM',
  'Central Midfielder':      'CM',
  'Attacking Midfielder':    'CAM',
  'Left Midfielder':         'LM',
  'Right Midfielder':        'RM',
  'Box-to-Box Midfielder':   'CM',
  'Holding Midfielder':      'CDM',
  'Deep-Lying Playmaker':    'CDM',
  'Advanced Playmaker':      'CAM',

  // Midfielders — football-data.org specific strings
  'Defensive Midfield':      'CDM',
  'Central Midfield':        'CM',
  'Attacking Midfield':      'CAM',
  'Left Midfield':           'LM',
  'Right Midfield':          'RM',

  // Midfielders — coarse
  'Midfielder':              'CM',
  'Midfield':                'CM',   // football-data.org coarse

  // Attackers — specific (API-Football + FD shared)
  'Centre-Forward':          'ST',
  'Center-Forward':          'ST',
  'Second Striker':          'SS',
  'Left Winger':             'LW',
  'Right Winger':            'RW',
  'False Nine':              'SS',
  'Inside Forward':          'LW',
  'Striker':                 'ST',
  'Forward':                 'ST',

  // Attackers — coarse
  'Attacker':                'ST',
  'Offence':                 'ST',   // football-data.org coarse
};

/**
 * Normalise an API-Football position string to our internal enum.
 * Returns null if the string is unrecognised (caller should keep existing value).
 */
function normalizePosition(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (POSITION_MAP[trimmed]) return POSITION_MAP[trimmed];

  // Case-insensitive fallback
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(POSITION_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }

  // Coarse keyword fallback
  if (/goalkeeper/i.test(lower))  return 'GK';
  if (/defender/i.test(lower))    return 'CB';
  if (/midfielder/i.test(lower))  return 'CM';
  if (/attacker|forward/i.test(lower)) return 'ST';
  if (/winger/i.test(lower))      return lower.includes('left') ? 'LW' : 'RW';
  if (/back/i.test(lower))        return lower.includes('left') ? 'LB' : 'RB';

  return null;
}

module.exports = { normalizePosition };

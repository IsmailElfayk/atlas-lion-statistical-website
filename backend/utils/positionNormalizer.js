// Maps API-Football position strings → our internal primaryPosition enum
// API-Football coarse: "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"
// API-Football specific (lineup/fixture endpoints): "Centre-Back", "Left-Back", etc.

const POSITION_MAP = {
  // Goalkeepers
  'Goalkeeper':              'GK',

  // Defenders — specific
  'Centre-Back':             'CB',
  'Center-Back':             'CB',
  'Right-Back':              'RB',
  'Left-Back':               'LB',
  'Right Wing-Back':         'RWB',
  'Left Wing-Back':          'LWB',
  'Sweeper':                 'CB',

  // Defenders — coarse fallback
  'Defender':                'CB',

  // Midfielders — specific
  'Defensive Midfielder':    'CDM',
  'Central Midfielder':      'CM',
  'Attacking Midfielder':    'CAM',
  'Left Midfielder':         'LM',
  'Right Midfielder':        'RM',
  'Box-to-Box Midfielder':   'CM',
  'Holding Midfielder':      'CDM',
  'Deep-Lying Playmaker':    'CDM',
  'Advanced Playmaker':      'CAM',

  // Midfielders — coarse fallback
  'Midfielder':              'CM',

  // Attackers — specific
  'Centre-Forward':          'ST',
  'Center-Forward':          'ST',
  'Second Striker':          'SS',
  'Left Winger':             'LW',
  'Right Winger':            'RW',
  'False Nine':              'SS',
  'Inside Forward':          'LW', // default; override to RW by context if needed
  'Striker':                 'ST',

  // Attackers — coarse fallback
  'Attacker':                'ST',
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

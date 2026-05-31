/**
 * Moroccan nationality helper.
 * Detection is purely API-based — no hardcoded player list.
 * football-data.org returns nationality as a country-name string, e.g. "Morocco".
 */

function isMoroccan(person) {
  return (person?.nationality || '').toLowerCase() === 'morocco';
}

module.exports = { isMoroccan };

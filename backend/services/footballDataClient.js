/**
 * football-data.org v4 API client
 *
 * Single key (FOOTBALL_DATA_API_KEY), sliding-window rate limiter (10 req / 11 min),
 * dual-TTL Redis cache (23 h static / 30 min live data).
 */

const axios    = require('axios');
const { getRedis } = require('../config/redis');

const BASE_URL   = 'https://api.football-data.org/v4';
const WINDOW_MS  = 660_000;  // 11-min safe window (free tier: 10 req / 10 min)
const MAX_REQ    = 10;
const TTL_STATIC = 82_800;   // 23 h — competitions, teams, squads, persons
const TTL_LIVE   = 1_800;    // 30 min — matches, lineups

const FREE_TIER_COMPETITIONS = {
  CL:  { name: 'UEFA Champions League',          bucket: 'other_europe' },
  PL:  { name: 'Premier League',                 bucket: 'big5'         },
  PD:  { name: 'La Liga',                        bucket: 'big5'         },
  BL1: { name: 'Bundesliga',                     bucket: 'big5'         },
  SA:  { name: 'Serie A',                        bucket: 'big5'         },
  FL1: { name: 'Ligue 1',                        bucket: 'big5'         },
  DED: { name: 'Eredivisie',                     bucket: 'other_europe' },
  ELC: { name: 'Championship',                   bucket: 'other_europe' },
  PPL: { name: 'Primeira Liga',                  bucket: 'other_europe' },
  EC:  { name: 'European Championship',          bucket: 'other_europe' },
  BSA: { name: 'Campeonato Brasileiro Série A',  bucket: 'americas'     },
  WC:  { name: 'FIFA World Cup',                 bucket: 'world'        },
};

// Kept for backward compatibility with fdSyncService / syncLeagues imports
const FREE_TIER_CODES     = Object.keys(FREE_TIER_COMPETITIONS);
const COMPETITION_BUCKET  = Object.fromEntries(
  Object.entries(FREE_TIER_COMPETITIONS).map(([code, v]) => [code, v.bucket])
);

// Sliding-window timestamp queue
const requestTimestamps = [];

// ── Rate limiter ──────────────────────────────────────────────────────────────

function _pruneWindow() {
  const cutoff = Date.now() - WINDOW_MS;
  while (requestTimestamps.length && requestTimestamps[0] <= cutoff) {
    requestTimestamps.shift();
  }
}

async function _waitForSlot() {
  _pruneWindow();
  if (requestTimestamps.length >= MAX_REQ) {
    const waitMs = requestTimestamps[0] + WINDOW_MS + 1_000 - Date.now();
    if (waitMs > 0) {
      console.log(`[FD-API] ⏳ queue full (${requestTimestamps.length}/10) — waiting ${(waitMs / 60_000).toFixed(1)} min`);
      await new Promise(r => setTimeout(r, waitMs));
      _pruneWindow();
    }
  }
  requestTimestamps.push(Date.now());
}

function getRateLimitStatus() {
  _pruneWindow();
  const n = requestTimestamps.length;
  const msUntilNextSlot = n >= MAX_REQ
    ? Math.max(0, requestTimestamps[0] + WINDOW_MS + 1_000 - Date.now())
    : 0;
  return { requestsInWindow: n, msUntilNextSlot };
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

function _cacheKey(method, path, params) {
  const pStr = params && Object.keys(params).length
    ? Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&')
    : '';
  return `fd:v4:${method}:${path}${pStr ? ':' + pStr : ''}`;
}

// ── Core GET ──────────────────────────────────────────────────────────────────

async function _get(method, path, params = {}, ttl = TTL_STATIC) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error('FOOTBALL_DATA_API_KEY is not set');

  const cacheKey = _cacheKey(method, path, params);
  const redis    = getRedis();
  let cached     = false;

  if (redis) {
    try {
      const hit = await redis.get(cacheKey);
      if (hit !== null) {
        cached = true;
        const { requestsInWindow } = getRateLimitStatus();
        console.log(`[FD-API] ${method} | queue: ${requestsInWindow}/10 | cached: true`);
        return hit;
      }
    } catch { /* skip */ }
  }

  await _waitForSlot();
  const { requestsInWindow } = getRateLimitStatus();
  console.log(`[FD-API] ${method} | queue: ${requestsInWindow}/10 | cached: false`);

  const res = await axios.get(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': apiKey },
    params,
    timeout: 15_000,
  });

  const data = res.data;

  if (redis) {
    redis.set(cacheKey, data, { ex: ttl }).catch(() => {});
  }

  return data;
}

// ── Public methods ────────────────────────────────────────────────────────────

/** GET /v4/competitions — filtered to free-tier codes only */
async function getCompetitions() {
  const data = await _get('getCompetitions', '/competitions', {}, TTL_STATIC);
  const competitions = (data.competitions || []).filter(c => FREE_TIER_CODES.includes(c.code));
  return { ...data, competitions };
}

/** GET /v4/competitions/{code}/teams?season={year} */
async function getCompetitionTeams(code, season) {
  return _get('getCompetitionTeams', `/competitions/${code}/teams`, season != null ? { season } : {}, TTL_STATIC);
}

/** GET /v4/competitions/{code}/matches?season={year}&...filters */
async function getCompetitionMatches(code, season, filters = {}) {
  return _get(
    'getCompetitionMatches',
    `/competitions/${code}/matches`,
    { ...(season != null ? { season } : {}), ...filters },
    TTL_LIVE
  );
}

/** GET /v4/matches/{id} — full match with lineups, goals, bookings, substitutions */
async function getMatch(matchId) {
  return _get('getMatch', `/matches/${matchId}`, {}, TTL_LIVE);
}

/** GET /v4/teams/{id} — includes squad array */
async function getTeam(teamId) {
  return _get('getTeam', `/teams/${teamId}`, {}, TTL_STATIC);
}

/** GET /v4/persons/{id} — full player profile */
async function getPerson(personId) {
  return _get('getPerson', `/persons/${personId}`, {}, TTL_STATIC);
}

/** GET /v4/persons/{id}/matches?limit={n}&status={s} — last N finished matches for a player */
async function getPersonMatches(personId, limit = 35, filters = {}) {
  return _get('getPersonMatches', `/persons/${personId}/matches`, { limit, ...filters }, TTL_LIVE);
}

module.exports = {
  getCompetitions,
  getCompetitionTeams,
  getCompetitionMatches,
  getMatch,
  getTeam,
  getPerson,
  getPersonMatches,
  getRateLimitStatus,
  FREE_TIER_COMPETITIONS,
  FREE_TIER_CODES,
  COMPETITION_BUCKET,
};

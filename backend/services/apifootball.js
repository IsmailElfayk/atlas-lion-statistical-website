/**
 * API-Football multi-key rotation service
 *
 * Reads API_FOOTBALL_KEY1…KEY7 from env.
 * Before every actual request it calls GET /status on the current key:
 *   - If the key is exhausted (rate-limit error) or has any API-level errors
 *     → mark key exhausted and move to the next key automatically.
 *   - If requests.current >= 99 → also switch.
 *   - If ALL keys are exhausted → log a clear warning and return null (never throws).
 * Logs every key switch.
 * No Redis — MongoDB is the persistent cache.
 */

const axios = require('axios');

const BASE_URL    = 'https://v3.football.api-sports.io';
const TIMEOUT_MS  = 15_000;
const THROTTLE_MS = 7_000;   // ≤ 10 req/min on the free tier

// ── Load keys ────────────────────────────────────────────────────────────────
const KEYS = [];
for (let i = 1; i <= 7; i++) {
  const val = process.env[`API_FOOTBALL_KEY${i}`];
  if (val) KEYS.push({ key: val, label: `Key ${i}`, exhausted: false, requestsMade: 0 });
}

if (KEYS.length === 0) {
  console.warn('[API-Football] ⚠ No API_FOOTBALL_KEY1…7 found in env — sync will not work');
}

let _currentIdx = 0;
let _lastCallMs = 0;

// ── Internal helpers ──────────────────────────────────────────────────────────

async function throttle() {
  const wait = THROTTLE_MS - (Date.now() - _lastCallMs);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _lastCallMs = Date.now();
}

async function rawGet(path, params, apiKey) {
  await throttle();
  const res = await axios.get(`${BASE_URL}${path}`, {
    headers : { 'x-apisports-key': apiKey },
    params,
    timeout : TIMEOUT_MS,
  });
  return res.data;
}

/**
 * Returns true when the API body signals the key cannot be used:
 *   - Any non-empty errors object (rate limit, missing token, invalid token, etc.)
 *   - HTTP 4xx is handled separately via try/catch in rawGet
 */
function isKeyUnusable(data) {
  if (!data?.errors) return false;
  if (Array.isArray(data.errors) && data.errors.length === 0) return false;
  if (typeof data.errors === 'object' && Object.keys(data.errors).length > 0) return true;
  return false;
}

function activeState() {
  while (_currentIdx < KEYS.length && KEYS[_currentIdx].exhausted) _currentIdx++;
  return _currentIdx < KEYS.length ? KEYS[_currentIdx] : null;
}

function exhaustCurrent() {
  const cur = KEYS[_currentIdx];
  if (!cur) return;
  cur.exhausted = true;
  _currentIdx++;
  const next = KEYS[_currentIdx];
  if (next) {
    console.log(`[API-Football] ${cur.label} exhausted → switching to ${next.label}`);
  } else {
    console.warn('[API-Football] ⚠ ALL KEYS EXHAUSTED — waiting for midnight reset');
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * GET path with automatic multi-key rotation.
 *
 * Flow per attempt:
 *   1. Check /status — switch key on any API-level error or requests >= 99.
 *   2. Make the actual request — switch key on 4xx/5xx instead of throwing.
 *   3. Check response body for mid-flight rate-limit signals; switch and retry.
 *
 * @returns {object|null}  Full API-Football response envelope, or null when all keys exhausted.
 */
async function get(path, params = {}) {
  for (let attempt = 0; attempt <= KEYS.length; attempt++) {
    const state = activeState();
    if (!state) {
      console.warn('[API-Football] ⚠ ALL KEYS EXHAUSTED — waiting for midnight reset');
      return null;
    }

    // ── Step 1: pre-flight /status check (first use of this key only) ─────────
    // Only call /status when the key is fresh (requestsMade === 0) to verify it
    // has remaining quota before we commit requests. Mid-run exhaustion is caught
    // by isKeyUnusable() on the response body in Step 3 below.
    if (state.requestsMade === 0) {
      let statusData;
      try {
        statusData = await rawGet('/status', {}, state.key);
      } catch (err) {
        console.error(`[API-Football] /status HTTP error for ${state.label}: ${err.message}`);
        exhaustCurrent();
        continue;
      }

      if (isKeyUnusable(statusData)) {
        const errMsg = typeof statusData.errors === 'object'
          ? Object.values(statusData.errors)[0]
          : statusData.errors;
        console.log(`[API-Football] ${state.label} unusable (${errMsg}) → switching`);
        exhaustCurrent();
        continue;
      }

      const reqCurrent = !Array.isArray(statusData?.response)
        ? (statusData?.response?.requests?.current ?? 0)
        : 100;

      if (reqCurrent >= 99) {
        console.log(`[API-Football] ${state.label} at ${reqCurrent}/100 — marking exhausted`);
        exhaustCurrent();
        continue;
      }

      state.requestsMade += 1; // count the status call
    }

    // ── Step 2: actual request ────────────────────────────────────────────────
    let data;
    try {
      data = await rawGet(path, params, state.key);
    } catch (err) {
      // 4xx from the actual endpoint → treat as key exhausted, try next key
      if (err.response?.status >= 400 && err.response?.status < 500) {
        console.error(`[API-Football] ${state.label} GET ${path} → HTTP ${err.response.status}, switching key`);
        exhaustCurrent();
        continue;
      }
      // Genuine network / server error — surface to caller
      console.error(`[API-Football] GET ${path} failed: ${err.message}`);
      throw err;
    }

    state.requestsMade += 1; // actual request (status was counted separately on first use)

    // Mid-flight rate-limit (key consumed between status check and request)
    if (isKeyUnusable(data)) {
      console.log(`[API-Football] ${state.label} rate-limited on response body → switching`);
      exhaustCurrent();
      return get(path, params); // tail-recurse with next key
    }

    if (data.results === 0 || (Array.isArray(data.response) && data.response.length === 0)) {
      console.warn(`[API-Football] ⚠ results=0  GET ${path}  params=${JSON.stringify(params)}`);
    } else {
      console.log(`[API-Football] ✓ ${state.label}  GET ${path}  results=${data.results}`);
    }

    return data;
  }

  console.warn('[API-Football] ⚠ ALL KEYS EXHAUSTED — waiting for midnight reset');
  return null;
}

/** Reset all keys to active — called at the start of every nightly sync. */
function reset() {
  KEYS.forEach(k => { k.exhausted = false; k.requestsMade = 0; });
  _currentIdx = 0;
  _lastCallMs = 0;
  console.log(`[API-Football] Key rotation reset — ${KEYS.length} keys active for new day`);
}

/** Per-key usage snapshot for sync reports. */
function getKeyStates() {
  return KEYS.map(k => ({
    label       : k.label,
    exhausted   : k.exhausted,
    requestsMade: k.requestsMade,
  }));
}

module.exports = { get, reset, getKeyStates };

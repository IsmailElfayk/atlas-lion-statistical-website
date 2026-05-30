const axios = require('axios');

const apifb = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  timeout: 15000,
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY || '',
  },
});

apifb.interceptors.response.use(
  (res) => {
    const remaining = res.headers['x-ratelimit-requests-remaining'];
    if (remaining !== undefined && Number(remaining) < 10) {
      console.warn(`[API-Football] ⚠ Only ${remaining} requests remaining today`);
    }
    if (res.data?.errors && Object.keys(res.data.errors).length) {
      const err = new Error(`API-Football error: ${JSON.stringify(res.data.errors)}`);
      err.apiErrors = res.data.errors;
      return Promise.reject(err);
    }
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message;
    console.error(`[API-Football] HTTP ${status}: ${msg}`);
    return Promise.reject(err);
  }
);

module.exports = apifb;

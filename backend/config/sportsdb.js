const axios = require('axios');

// TheSportsDB — public key 123, no sign-up needed
// Rate limit: 30 req/min
const sportsdb = axios.create({
  baseURL: 'https://www.thesportsdb.com/api/v1/json/123',
  timeout: 10000,
});

sportsdb.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(`[TheSportsDB] ${err.response?.status}: ${err.message}`);
    return Promise.reject(err);
  }
);

module.exports = sportsdb;

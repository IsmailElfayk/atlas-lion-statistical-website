const axios = require('axios');

// StatsBomb Open Data — public GitHub raw files, no auth required
const statsbomb = axios.create({
  baseURL: 'https://raw.githubusercontent.com/statsbomb/open-data/master/data',
  timeout: 30000, // event files can be large
});

statsbomb.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(`[StatsBomb] ${err.response?.status}: ${err.message}`);
    return Promise.reject(err);
  }
);

module.exports = statsbomb;

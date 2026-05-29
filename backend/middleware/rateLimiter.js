const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, meta: {}, error: 'Too many requests, please try again later.' },
});

module.exports = limiter;

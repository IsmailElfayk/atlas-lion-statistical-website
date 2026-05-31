/**
 * SyncProgress — tracks the state of the daily chunked sync pipeline.
 *
 * One document per UTC day (auto-deleted + recreated at midnight).
 * Phases (ordered by priority):
 *   ratings → matches → players → done
 *
 * Phase budget: 95 req/day (safe margin under free-tier 100/day limit).
 */

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD UTC

  currentPhase: {
    type:    String,
    enum:    ['ratings', 'matches', 'players', 'done'],
    default: 'ratings',
  },

  // Position within the current phase:
  //   ratings → Player array skip offset
  //   matches / players → FREE_TIER_CODES slice start index
  phaseIndex: { type: Number, default: 0 },

  // Running total of API calls made today (budget guard)
  requestsToday: { type: Number, default: 0 },

  // Cumulative write counts per phase
  written: {
    ratings: { type: Number, default: 0 },
    matches: { type: Number, default: 0 },
    players: { type: Number, default: 0 },
  },

  lastChunkAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('SyncProgress', schema);

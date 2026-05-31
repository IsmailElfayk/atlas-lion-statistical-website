const { Schema, model } = require('mongoose');

const ratingSchema = new Schema({
  // ── Core references ─────────────────────────────────────────────────────────
  player     : { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  match      : { type: Schema.Types.ObjectId, ref: 'Match',  required: true },

  // ── Match context (denormalised for fast per-player queries) ────────────────
  matchDate  : { type: Date,   required: true, index: true },
  competition: String,       // league / tournament name from API-Football
  homeTeam   : String,
  awayTeam   : String,
  homeScore  : Number,
  awayScore  : Number,

  // ── Performance stats ───────────────────────────────────────────────────────
  minutes    : Number,
  goals      : { type: Number, default: 0 },
  assists    : { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards   : { type: Number, default: 0 },
  saves      : Number,       // GK only

  // ── Ratings ─────────────────────────────────────────────────────────────────
  sofascoreRating  : Number,  // 3–10 from statistics[].games.rating
  fotmobRating     : Number,
  whoscoredRating  : Number,
  xtTotal          : Number,
  vaepTotal        : Number,
  normalisedCustom : Number,

  // ── Computed performance score (football-data.org event pipeline) ────────────
  performanceScore   : { type: Number, min: 0, max: 10, default: null },
  computedFromEvents : { type: Boolean, default: false },
  matchEvents: {
    goals           : { type: Number, default: 0 },
    assists         : { type: Number, default: 0 },
    yellowCards     : { type: Number, default: 0 },
    redCards        : { type: Number, default: 0 },
    ownGoals        : { type: Number, default: 0 },
    penaltiesScored : { type: Number, default: 0 },
    minutesPlayed   : { type: Number, default: 0 },
    wasStarter      : { type: Boolean, default: false },
    wasBench        : { type: Boolean, default: false },
  },

  // ── Quality tier ────────────────────────────────────────────────────────────
  dataQuality: {
    type   : String,
    enum   : ['event', 'rating', 'heuristic', 'none'],
    default: 'none',
  },
}, { timestamps: true });

// Prevent duplicate (player, match) pairs
ratingSchema.index({ player: 1, match: 1 }, { unique: true });
ratingSchema.index({ player: 1 });

module.exports = model('Rating', ratingSchema);

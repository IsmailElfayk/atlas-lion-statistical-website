const { Schema, model } = require('mongoose');

const leagueSchema = new Schema({
  apiFootballId: Number,
  name: { type: String, required: true },
  country: String,
  tier: Number,
  confederation: { type: String, enum: ['UEFA','CAF','CONMEBOL','AFC','CONCACAF','OFC'] },
  bucket: { type: String, enum: ['big5','other_europe','botola','mena','americas','world'] },
  hasEventData: { type: Boolean, default: false },
  hasSofascoreRatings: { type: Boolean, default: true },
  logoUrl: String,
}, { timestamps: true });

module.exports = model('League', leagueSchema);

const { Schema, model } = require('mongoose');

const ratingSchema = new Schema({
  player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  matchDate: Date,
  minutes: Number,
  sofascoreRating: Number,
  fotmobRating: Number,
  whoscoredRating: Number,
  xtTotal: Number,
  vaepTotal: Number,
  normalisedCustom: Number,
  dataQuality: { type: String, enum: ['event','rating','heuristic','none'], default: 'none' },
}, { timestamps: true });

ratingSchema.index({ player: 1, match: 1 }, { unique: true });
ratingSchema.index({ player: 1 });
ratingSchema.index({ matchDate: 1 });

module.exports = model('Rating', ratingSchema);

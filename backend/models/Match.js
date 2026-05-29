const { Schema, model } = require('mongoose');

const matchSchema = new Schema({
  apiFootballId: Number,
  league: { type: Schema.Types.ObjectId, ref: 'League' },
  season: String,
  kickoffUtc: Date,
  homeClub: { type: Schema.Types.ObjectId, ref: 'Club' },
  awayClub: { type: Schema.Types.ObjectId, ref: 'Club' },
  homeScore: Number,
  awayScore: Number,
  status: { type: String, enum: ['scheduled','in_play','finished'], default: 'scheduled' },
  competition: String,
  hasEventData: { type: Boolean, default: false },
  moroccansPlaying: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
}, { timestamps: true });

matchSchema.index({ kickoffUtc: 1 });
matchSchema.index({ league: 1 });

module.exports = model('Match', matchSchema);

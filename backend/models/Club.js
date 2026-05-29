const { Schema, model } = require('mongoose');

const clubSchema = new Schema({
  apiFootballId: Number,
  transfermarktId: String,
  name: { type: String, required: true },
  shortName: String,
  league: { type: Schema.Types.ObjectId, ref: 'League' },
  country: String,
  logoUrl: String,
  color: String,
}, { timestamps: true });

module.exports = model('Club', clubSchema);

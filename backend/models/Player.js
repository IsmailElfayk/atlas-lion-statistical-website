const { Schema, model } = require('mongoose');

const playerSchema = new Schema({
  slug: { type: String, unique: true },
  // Consolidated external IDs (preferred over top-level legacy fields)
  externalIds: {
    apiFootball:  { type: Number, index: true, sparse: true },
    sportsdb:     String,
    transfermarkt: String,
  },
  // Legacy top-level IDs kept for backward compat
  sofascoreId: Number,
  apiFootballId: Number,
  transfermarktId: String,
  wikidataQid: String,
  fullName: { type: String, required: true },
  fullNameAr: String,
  dob: Date,
  age: Number,
  height: Number,
  preferredFoot: { type: String, enum: ['Left','Right','Both'] },
  photoUrl: String,
  primaryPosition: { type: String, enum: ['GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','SS','ST','DM','AM','WB'] },
  eligiblePositions: [String],
  isMoroccanNational: { type: Boolean, default: true },
  moroccoEligibility: { type: String, enum: ['capped','eligible','switchable','ineligible'], default: 'eligible' },
  nationalities: [String],
  currentClub: { type: Schema.Types.ObjectId, ref: 'Club' },
  marketValueEur: Number,
  marketValueUpdatedAt: Date,
  archetypeLabel: String,
  minutesCurrent: { type: Number, default: 0 },
  status: { type: String, enum: ['available','doubtful','injured','suspended'], default: 'available' },
  returnDate: Date,
  lastSyncedAt: Date,
}, { timestamps: true });

playerSchema.index({ fullName: 'text', fullNameAr: 'text' });

module.exports = model('Player', playerSchema);

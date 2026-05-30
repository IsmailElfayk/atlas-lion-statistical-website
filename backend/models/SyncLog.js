const { Schema, model } = require('mongoose');

const syncLogSchema = new Schema({
  startedAt       : { type: Date, required: true },
  finishedAt      : Date,
  durationMs      : Number,
  playersUpserted : { type: Number, default: 0 },
  ratingsUpserted : { type: Number, default: 0 },
  keysUsed        : { type: Number, default: 0 },
  requestsPerKey  : { type: Schema.Types.Mixed, default: {} },
  errors          : { type: [String], default: [] },
}, { timestamps: true, suppressReservedKeysWarning: true });

syncLogSchema.index({ startedAt: -1 });

module.exports = model('SyncLog', syncLogSchema);

// Maps a player's primaryPosition to eligible formation slot types
const POS_TO_SLOTS = {
  GK:  ['GK'],
  CB:  ['CB'],
  RB:  ['RB','WB','RM'],
  LB:  ['LB','WB','LM'],
  RWB: ['WB','RB','RM'],
  LWB: ['WB','LB','LM'],
  WB:  ['WB','RB','LB'],
  CDM: ['DM','CM'],
  DM:  ['DM','CM'],
  CM:  ['CM','DM','AM','LM','RM'],
  CAM: ['AM','CM'],
  AM:  ['AM','CM'],
  LM:  ['LM','LW','CM'],
  RM:  ['RM','RW','CM'],
  LW:  ['LW','LM','ST'],
  RW:  ['RW','RM','ST'],
  SS:  ['ST','LW','RW','AM'],
  ST:  ['ST','LW','RW','AM'],
};

module.exports = POS_TO_SLOTS;

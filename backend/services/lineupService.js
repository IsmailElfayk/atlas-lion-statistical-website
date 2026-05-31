const formations = require('../utils/formations');
const { getAllWindowAverages } = require('./ratingService');

/**
 * Greedy per-slot assignment:
 * For each slot, pick the highest-avgRating candidate whose primaryPosition
 * is in slot.eligiblePositions. Each player can only fill one slot.
 *
 * candidates: [{ playerId, slug, fullName, primaryPosition, avgRating, dataQuality, ... }]
 */
async function optimize({ formation, candidates }) {
  const slots = formations[formation];
  if (!slots) throw new Error(`Unknown formation: ${formation}`);

  const sorted = [...candidates].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));

  const result = slots.map(s => ({ ...s, player: null, subs: [] }));
  const assignedSlugs = new Set();

  for (let i = 0; i < slots.length; i++) {
    const { eligiblePositions } = slots[i];
    for (const candidate of sorted) {
      const id = candidate.slug || candidate.playerId;
      if (!assignedSlugs.has(id) && eligiblePositions.includes(candidate.primaryPosition)) {
        result[i].player = candidate;
        assignedSlugs.add(id);
        break;
      }
    }
  }

  // Attach windowAverages to each starter (11 parallel DB queries)
  await Promise.all(
    result.map(async slot => {
      if (!slot.player) return;
      try {
        slot.player = {
          ...slot.player,
          windowAverages: await getAllWindowAverages(slot.player.playerId),
        };
      } catch { /* non-fatal — leave windowAverages undefined */ }
    })
  );

  // Subs per slot: position-eligible, sorted by avgRating desc,
  // excluding only the slot's own starter (not all starters)
  for (let i = 0; i < slots.length; i++) {
    const { eligiblePositions } = slots[i];
    const starterId = result[i].player ? (result[i].player.slug || result[i].player.playerId) : null;
    result[i].subs = sorted
      .filter(c => {
        const id = c.slug || c.playerId;
        return id !== starterId && eligiblePositions.includes(c.primaryPosition);
      })
      .slice(0, 9);
  }

  const filled = result.filter(r => r.player).length;
  const mean   = (result.reduce((s, r) => s + (r.player?.avgRating || 0), 0) / 11).toFixed(2);
  console.log(`[Lineup] ${formation} → ${filled}/11 slots filled, mean rating: ${mean}`);

  return {
    formation,
    startingXI: result,
    subsBySlot: Object.fromEntries(result.map(r => [r.id, r.subs])),
  };
}

module.exports = { optimize };

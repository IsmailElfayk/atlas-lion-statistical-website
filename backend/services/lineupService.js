const formations = require('../utils/formations');

// Pure O(n³) Hungarian algorithm (Kuhn–Munkres)
function hungarian(cost) {
  const n = cost.length;
  const INF = Infinity;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(INF);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF, j1 = -1;
      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else { minv[j] -= delta; }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const assignment = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j] > 0) assignment[p[j] - 1] = j - 1;
  return assignment;
}

/**
 * candidates: [{ playerId, fullName, slug, photoUrl, primaryPosition, eligiblePositions, avgRating, dataQuality, club, ... }]
 */
async function optimize({ formation, candidates }) {
  const slots = formations[formation];
  if (!slots) throw new Error(`Unknown formation: ${formation}`);

  const S = slots.length; // 11
  const pool = [...candidates];
  const P = pool.length;
  const sortedAll = [...pool].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));

  const result = slots.map(s => ({ ...s, player: null, subs: [] }));

  if (P > 0) {
    const N = Math.max(S, P);
    const BIG = 1e6;
    const cost = Array.from({ length: N }, (_, i) =>
      Array.from({ length: N }, (_, j) => {
        if (i < S && j < P) {
          const eligible = pool[j].eligiblePositions?.some(ep =>
            slots[i].eligiblePositions.includes(ep)
          );
          return eligible ? -(pool[j].avgRating ?? 0) : BIG;
        }
        return 0;
      })
    );
    const assign = hungarian(cost);
    const usedIdx = new Set();
    for (let i = 0; i < S; i++) {
      const j = assign[i];
      if (j != null && j >= 0 && j < P && cost[i][j] < BIG) {
        result[i].player = pool[j];
        usedIdx.add(j);
      }
    }
    // Build subs per slot
    result.forEach(rs => {
      const usedIds = new Set(result.map(r => r.player?.slug || r.player?.playerId).filter(Boolean));
      rs.subs = sortedAll
        .filter(c => {
          const id = c.slug || c.playerId;
          return !usedIds.has(id) && c.eligiblePositions?.some(ep => rs.eligiblePositions.includes(ep));
        })
        .slice(0, 9);
    });

    const filled = result.filter(r => r.player).length;
    const mean = (result.reduce((s, r) => s + (r.player?.avgRating || 0), 0) / 11).toFixed(2);
    console.log(`[Lineup] ${formation} → ${filled}/11 slots filled, mean rating: ${mean}`);
  }

  return { formation, startingXI: result, subsBySlot: Object.fromEntries(result.map(r => [r.id, r.subs])) };
}

module.exports = { optimize };

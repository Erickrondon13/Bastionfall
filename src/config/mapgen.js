import { assembleMap } from "./maps.js";

export const TIER_LABELS = ["básico", "medio", "experto", "avanzado"];

export function tierLabel(tier) {
  return TIER_LABELS[(tier || 1) - 1] || TIER_LABELS[0];
}

export function cavernMapTiers(cavernTier) {
  const out = [];
  for (let m = 0; m < 5; m++) {
    out.push(Math.min(4, cavernTier + Math.floor(m / 2)));
  }
  return out;
}

function generatePath(rows, cols, rng, tier) {
  const visited = new Set();
  const path = [];
  const push = (c, r) => {
    path.push([c, r]);
    visited.add(c + "," + r);
  };
  const startR = 1 + Math.floor(rng() * (rows - 2));
  let c = 0;
  let r = startR;
  push(c, r);
  const baseR = 1 + Math.floor(rng() * (rows - 2));
  const wiggle = 0.25 + tier * 0.08;
  let guard = 0;
  while (c < cols - 1 && guard++ < 2000) {
    const options = [];
    const right = [c + 1, r];
    const up = [c, r - 1];
    const down = [c, r + 1];
    if (rng() < 0.7 && c + 1 < cols && !visited.has(right[0] + "," + right[1])) options.push(right);
    if (rng() < wiggle && r - 1 > 0 && !visited.has(c + "," + (r - 1))) options.push(up);
    if (rng() < wiggle && r + 1 < rows - 1 && !visited.has(c + "," + (r + 1))) options.push(down);
    if (options.length === 0) {
      if (c + 1 < cols && !visited.has(right[0] + "," + right[1])) options.push(right);
      else {
        const nb = [[c + 1, r], [c - 1, r], [c, r - 1], [c, r + 1]].find(
          ([nc, nr]) => nc >= 0 && nc < cols && nr >= 0 && nr < rows && !visited.has(nc + "," + nr)
        );
        if (!nb) break;
        options.push(nb);
      }
    }
    const [nc, nr] = options[Math.floor(rng() * options.length)];
    c = nc;
    r = nr;
    push(c, r);
  }
  while (c < cols - 1) {
    c++;
    push(c, r);
  }
  while (r !== baseR) {
    r += r < baseR ? 1 : -1;
    push(c, r);
  }
  return path;
}

export function generateCaveMap(tier, rng = Math.random) {
  const cols = 19;
  const rows = 13;
  const tile = 40;
  const waves = 4 + tier;
  const path = generatePath(rows, cols, rng, tier);
  const startGold = 100 + tier * 20;
  const startLife = 20;
  const raw = {
    id: `cave-${tier}-${Math.floor(rng() * 1e9)}`,
    name: `Caverna (${tierLabel(tier)})`,
    cols,
    rows,
    tile,
    path,
    startGold,
    startLife,
    waves,
    tier,
    cave: true,
  };
  return assembleMap(raw);
}

export function generateCavern(cavernTier, rng = Math.random) {
  const tiers = cavernMapTiers(cavernTier);
  const maps = tiers.map((t) => generateCaveMap(t, rng));
  return {
    tier: cavernTier,
    label: tierLabel(cavernTier),
    tiers,
    maps,
    index: 0,
  };
}

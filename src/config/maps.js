function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genPath(rows, cols, rng) {
  const visited = new Set();
  const path = [];
  const push = (c, r) => { path.push([c, r]); visited.add(c + "," + r); };
  let c = 0;
  let r = 1 + Math.floor(rng() * (rows - 2));
  push(c, r);
  let guard = 0;
  const wig = 0.5;
  while (c < cols - 1 && guard++ < 5000) {
    const opts = [];
    const right = [c + 1, r];
    const up = [c, r - 1];
    const down = [c, r + 1];
    if (c + 1 < cols && !visited.has(right[0] + "," + right[1])) opts.push(right);
    if (r - 1 > 0 && !visited.has(c + "," + (r - 1)) && rng() < wig) opts.push(up);
    if (r + 1 < rows - 1 && !visited.has(c + "," + (r + 1)) && rng() < wig) opts.push(down);
    if (!opts.length) {
      if (c + 1 < cols && !visited.has(right[0] + "," + right[1])) opts.push(right);
      else break;
    }
    const [nc, nr] = opts[Math.floor(rng() * opts.length)];
    c = nc; r = nr; push(c, r);
  }
  while (c < cols - 1) { c++; push(c, r); }
  return path;
}

function buildZones(path, cols, rows, types) {
  const blocked = new Set(path.map(([c, r]) => c + "," + r));
  const res = [];
  const step = Math.max(1, Math.floor(path.length / (types.length + 1)));
  types.forEach((type, i) => {
    const idx = Math.min(path.length - 2, (i + 1) * step);
    const [pc, pr] = path[idx];
    const neigh = [
      [pc + 1, pr], [pc - 1, pr], [pc, pr + 1], [pc, pr - 1],
      [pc + 1, pr + 1], [pc - 1, pr - 1], [pc + 1, pr - 1], [pc - 1, pr + 1],
    ];
    const cell = neigh.find(
      ([nc, nr]) => nc > 0 && nc < cols - 1 && nr > 0 && nr < rows - 1 && !blocked.has(nc + "," + nr)
    );
    if (cell) res.push({ c: cell[0], r: cell[1], type });
  });
  return res;
}

const GRID = { cols: 26, rows: 18, tile: 40 };

export const THEMES = {
  forest: {
    ambientColor: "#0e1710",
    bgTop: "#2c4626",
    bgBottom: "#16241a",
    terrain: ["#3f6130", "#4a7038", "#557d3f", "#36552a", "#61894a", "#476b34", "#52793c"],
    pathDirt: "rgba(110,84,46,0.32)",
    pathCenter: "#d8c08a",
    pathEdge: "#b3935f",
    light: "255,225,150",
    treeCanopy: ["#2f5a2a", "#3c6b30", "#4a7d39", "#588f42", "#356b2e"],
    treeTrunk: "#5a3d22",
    rock: ["#9a9a9a", "#7c7c7c", "#b3b3b3"],
    platform: { outer: "#4f4030", ring: "#9a9182", inner: "#6f685c", core: "#46e6ff" },
  },
};

function makeMap(id, name, seed, startGold, startLife, types, theme) {
  const rng = mulberry32(seed);
  const path = genPath(GRID.rows, GRID.cols, rng);
  const zones = buildZones(path, GRID.cols, GRID.rows, types);
  return {
    id,
    name,
    ...GRID,
    path,
    zones,
    startGold,
    startLife,
    theme: theme || "forest",
    lighting: {
      ambientColor: (THEMES[theme] || THEMES.forest).ambientColor,
      torchPoints: path.filter((_, index) => index % 5 === 0),
    },
  };
}

export const MAPS = {
  llanura: makeMap("llanura", "Bosque de Bastionfall", 1234, 120, 20, ["pantano", "montana"], "forest"),
  cañon: makeMap("cañon", "Garganta de la Fortaleza", 5678, 140, 18, ["lava", "montana", "bosque"], "forest"),
  cienagas: makeMap("cienagas", "Claros del Abismo", 9012, 130, 20, ["pantano", "lava", "bosque"], "forest"),
};

function computeBuildSlots(path, cols, rows, t) {
  const blocked = new Set(path.map(([c, r]) => `${c},${r}`));
  const seen = new Set();
  const cand = [];
  const neigh = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, -1], [1, -1], [-1, 1],
  ];
  for (const [c, r] of path) {
    for (const [dc, dr] of neigh) {
      const nc = c + dc, nr = r + dr;
      if (nc > 0 && nc < cols - 1 && nr > 0 && nr < rows - 1 && !blocked.has(`${nc},${nr}`)) {
        const k = `${nc},${nr}`;
        if (!seen.has(k)) { seen.add(k); cand.push([nc, nr]); }
      }
    }
  }
  const minDist = 2;
  const slots = [];
  for (const [c, r] of cand) {
    if (slots.length >= 18) break;
    if (slots.some(([sc, sr]) => Math.abs(sc - c) <= minDist && Math.abs(sr - r) <= minDist)) continue;
    slots.push([c, r]);
  }
  return slots.map(([c, r]) => ({ c, r, x: c * t + t / 2, y: r * t + t / 2 }));
}

export function assembleMap(m) {
  const t = m.tile;
  const pathPoints = m.path.map(([c, r]) => ({ x: c * t + t / 2, y: r * t + t / 2 }));
  const blocked = new Set(m.path.map(([c, r]) => `${c},${r}`));
  const base = pathPoints[pathPoints.length - 1];
  const buildSlots = computeBuildSlots(m.path, m.cols, m.rows, t);
  return {
    ...m,
    pathPoints,
    blocked,
    base,
    buildSlots,
    startGold: m.startGold,
    startLife: m.startLife,
  };
}

export function buildMap(id) {
  const m = MAPS[id] || MAPS.llanura;
  return assembleMap(m);
}

export const ZONE_TYPES = {
  pantano: {
    name: "Grieta Mágica",
    color: "#2a1b3d",
    glowColor: "#b55fe6",
    enemySlow: 0.55,
    texture: "crystal_cluster",
  },
  montana: {
    name: "Plataforma de Piedra",
    color: "#3e434f",
    towerRange: 1.3,
    texture: "stone_block",
  },
  lava: {
    name: "Veta de Magma",
    color: "#8a2b0d",
    glowColor: "#ff4500",
    enemyDps: 8,
    interval: 20,
    texture: "magma_vent",
  },
  bosque: {
    name: "Soporte de Madera",
    color: "#4a3319",
    towerRange: 0.75,
    texture: "wood_scaffolding",
  },
};

export function zoneAt(map, x, y) {
  if (!map || !map.zones) return null;
  const t = map.tile;
  const c = Math.floor(x / t);
  const r = Math.floor(y / t);
  for (const z of map.zones) if (z.c === c && z.r === r) return z.type;
  return null;
}

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

const GRID = { cols: 24, rows: 16, tile: 40 };

function makeMap(id, name, seed, startGold, startLife, types) {
  const rng = mulberry32(seed);
  const path = genPath(GRID.rows, GRID.cols, rng);
  const zones = buildZones(path, GRID.cols, GRID.rows, types);
  return { id, name, ...GRID, path, zones, startGold, startLife };
}

export const MAPS = {
  llanura: makeMap("llanura", "Llanura Asediada", 1234, 120, 20, ["pantano", "montana"]),
  cañon: makeMap("cañon", "Garganta del Cañón", 5678, 140, 18, ["lava", "montana", "bosque"]),
  cienagas: makeMap("cienagas", "Ciénagas Putrefactas", 9012, 130, 20, ["pantano", "lava", "bosque"]),
};

export function assembleMap(m) {
  const t = m.tile;
  const pathPoints = m.path.map(([c, r]) => ({ x: c * t + t / 2, y: r * t + t / 2 }));
  const blocked = new Set(m.path.map(([c, r]) => `${c},${r}`));
  const base = pathPoints[pathPoints.length - 1];
  return {
    ...m,
    pathPoints,
    blocked,
    base,
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
    color: "#2a1b3d", // Tono morado oscuro de cueva
    glowColor: "#b55fe6", // Brillo de cristal morado similar a la referencia
    enemySlow: 0.55,
    texture: "crystal_cluster" 
  },
  montana: { 
    name: "Plataforma de Piedra", 
    color: "#3e434f", // Piedra minera robusta
    towerRange: 1.3,
    texture: "stone_block" 
  },
  lava: { 
    name: "Veta de Magma", 
    color: "#8a2b0d", 
    glowColor: "#ff4500", // Luz cálida de fuego
    enemyDps: 8, 
    interval: 20,
    texture: "magma_vent"
  },
  bosque: { 
    name: "Soporte de Madera", 
    color: "#4a3319", // Madera de mina / andamio
    towerRange: 0.75,
    texture: "wood_scaffolding"
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

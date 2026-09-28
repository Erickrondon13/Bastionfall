export const MAPS = {
  llanura: {
    id: "llanura",
    name: "Llanura Asediada",
    cols: 19,
    rows: 13,
    tile: 40,
    startGold: 120,
    startLife: 20,
    path: [
      [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [2, 5], [3, 5], [4, 5], [5, 5], [5, 6],
      [5, 7], [5, 8], [5, 9], [6, 9], [7, 9], [8, 9], [8, 8], [8, 7], [8, 6], [8, 5],
      [9, 5], [10, 5], [11, 5], [11, 6], [11, 7], [11, 8], [11, 9], [11, 10], [11, 11], [12, 11],
      [13, 11], [14, 11], [15, 11], [16, 11], [17, 11], [18, 11],
    ],
    zones: [
      { c: 2, r: 4, type: "pantano" },
      { c: 2, r: 5, type: "pantano" },
      { c: 5, r: 7, type: "pantano" },
      { c: 6, r: 4, type: "montana" },
    ],
  },

  cañon: {
    id: "cañon",
    name: "Garganta del Cañón",
    cols: 19,
    rows: 13,
    tile: 40,
    startGold: 140,
    startLife: 18,
    path: [
      [0, 6], [1, 6], [2, 6], [3, 6], [3, 5], [3, 4], [4, 4], [5, 4], [6, 4], [6, 5],
      [6, 6], [6, 7], [6, 8], [7, 8], [8, 8], [9, 8], [9, 7], [9, 6], [9, 5], [9, 4],
      [10, 4], [11, 4], [12, 4], [12, 5], [12, 6], [12, 7], [12, 8], [13, 8], [14, 8], [15, 8],
      [16, 8], [17, 8], [18, 8],
    ],
    zones: [
      { c: 9, r: 8, type: "lava" },
      { c: 10, r: 8, type: "lava" },
      { c: 12, r: 6, type: "bosque" },
      { c: 11, r: 7, type: "bosque" },
    ],
  },

  cienagas: {
    id: "cienagas",
    name: "Ciénagas Putrefactas",
    cols: 19,
    rows: 13,
    tile: 40,
    startGold: 130,
    startLife: 20,
    path: [
      [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [2, 5], [3, 5], [4, 5], [5, 5], [5, 6],
      [5, 7], [5, 8], [5, 9], [6, 9], [7, 9], [8, 9], [8, 8], [8, 7], [8, 6], [8, 5],
      [9, 5], [10, 5], [11, 5], [11, 6], [11, 7], [11, 8], [11, 9], [11, 10], [11, 11], [12, 11],
      [13, 11], [14, 11], [15, 11], [16, 11], [17, 11], [18, 11],
    ],
    zones: [
      { c: 2, r: 4, type: "pantano" },
      { c: 2, r: 5, type: "pantano" },
      { c: 8, r: 7, type: "lava" },
      { c: 8, r: 8, type: "lava" },
      { c: 4, r: 3, type: "montana" },
      { c: 10, r: 4, type: "bosque" },
    ],
  },
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
  pantano: { name: "Pantano", color: "#3a7d44", enemySlow: 0.55 },
  montana: { name: "Montaña", color: "#8d99ae", towerRange: 1.3 },
  lava: { name: "Lava", color: "#e63946", enemyDps: 8, interval: 20 },
  bosque: { name: "Bosque", color: "#2a4d2e", towerRange: 0.75 },
};

export function zoneAt(map, x, y) {
  if (!map || !map.zones) return null;
  const t = map.tile;
  const c = Math.floor(x / t);
  const r = Math.floor(y / t);
  for (const z of map.zones) if (z.c === c && z.r === r) return z.type;
  return null;
}

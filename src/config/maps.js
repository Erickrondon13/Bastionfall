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
  },
};

export function buildMap(id) {
  const m = MAPS[id] || MAPS.llanura;
  const t = m.tile;
  const pathPoints = m.path.map(([c, r]) => ({ x: c * t + t / 2, y: r * t + t / 2 }));
  const blocked = new Set(m.path.map(([c, r]) => `${c},${r}`));
  const base = pathPoints[pathPoints.length - 1];
  return {
    id: m.id,
    name: m.name,
    cols: m.cols,
    rows: m.rows,
    tile: t,
    path: m.path,
    pathPoints,
    blocked,
    base,
    startGold: m.startGold,
    startLife: m.startLife,
  };
}

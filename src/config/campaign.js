export const WORLDS = [
  {
    id: "w1",
    name: "Mundo 1 — Llanuras",
    stages: [
      { id: "w1-1", name: "1-1 Sendero", map: "llanura", waves: 5, reward: { type: "tech", id: "dmg_arco" } },
      { id: "w1-2", name: "1-2 Avanzada", map: "llanura", waves: 7, reward: { type: "tech", id: "range_all" } },
      { id: "w1-3", name: "1-3 Bosque", map: "llanura", waves: 8, reward: { type: "tech", id: "dmg_canon" } },
      { id: "w1-boss", name: "1-BOSS Coloso", map: "llanura", waves: 10, boss: true, reward: { type: "tower", id: "hielo" } },
    ],
  },
  {
    id: "w2",
    name: "Mundo 2 — Cañones",
    stages: [
      { id: "w2-1", name: "2-1 Garganta", map: "cañon", waves: 9, reward: { type: "tech", id: "dmg_hielo" } },
      { id: "w2-2", name: "2-2 Risco", map: "cañon", waves: 11, reward: { type: "tech", id: "dmg_fuego" } },
      { id: "w2-3", name: "2-3 Desfiladero", map: "cañon", waves: 12, reward: { type: "tech", id: "dmg_canon" } },
      { id: "w2-boss", name: "2-BOSS Enjambre", map: "cañon", waves: 14, boss: true, reward: { type: "tower", id: "fuego" } },
    ],
  },
  {
    id: "w3",
    name: "Mundo 3 — Ciénagas",
    stages: [
      { id: "w3-1", name: "3-1 Pantano", map: "cienagas", waves: 9, reward: { type: "tech", id: "range_all" } },
      { id: "w3-2", name: "3-2 Cieno", map: "cienagas", waves: 11, reward: { type: "tech", id: "dmg_arco" } },
      { id: "w3-3", name: "3-3 Laguna", map: "cienagas", waves: 12, reward: { type: "tech", id: "dmg_fuego" } },
      { id: "w3-boss", name: "3-BOSS Vacío", map: "cienagas", waves: 15, boss: true, reward: { type: "tech", id: "dmg_canon" } },
    ],
  },
];

export const CAMPAIGN = WORLDS.flatMap((w) => w.stages);

export function stageById(id) {
  return CAMPAIGN.find((s) => s.id === id) || null;
}

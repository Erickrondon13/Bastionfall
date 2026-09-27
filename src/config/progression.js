export const TECH_NODES = [
  { id: "unlock_fuego", name: "Desbloquear Fuego", desc: "Nueva torre de quemadura (DoT).", cost: 60, kind: "unlock", target: "fuego" },
  { id: "gold1", name: "Oro inicial +40", desc: "Empiezas cada partida con más oro.", cost: 35, kind: "stat", stat: "startGold", value: 40 },
  { id: "life1", name: "Vida inicial +3", desc: "Tu base aguanta más golpes.", cost: 35, kind: "stat", stat: "startLife", value: 3 },
  { id: "dmg_arco", name: "Arco +20% daño", desc: "Mejora permanente de la torre Arco.", cost: 45, kind: "stat", stat: "dmg_arco", value: 0.20 },
  { id: "dmg_canon", name: "Cañón +20% daño", desc: "Mejora permanente de la torre Cañón.", cost: 45, kind: "stat", stat: "dmg_canon", value: 0.20 },
  { id: "dmg_hielo", name: "Hielo +20% daño", desc: "Mejora permanente de la torre Hielo.", cost: 45, kind: "stat", stat: "dmg_hielo", value: 0.20 },
  { id: "dmg_fuego", name: "Fuego +20% daño", desc: "Mejora permanente de la torre Fuego.", cost: 45, kind: "stat", stat: "dmg_fuego", value: 0.20 },
  { id: "range_all", name: "Alcance +10%", desc: "Todas las torres ganan alcance.", cost: 70, kind: "stat", stat: "range_all", value: 0.10 },
];

export const SAVE_KEY = "bastionfall.save.v1";

export function defaultSave() {
  return { esencia: 0, nodes: {}, tutorialDone: false };
}

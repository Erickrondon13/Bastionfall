export const TOWER_TYPES = [
  {
    key: "arco",
    name: "Arco",
    color: "#4cc9f0",
    proj: "#9be7ff",
    desc: "Rápido, bajo daño, buen rango",
    targeting: "first",
    levels: [
      { cost: 50, range: 130, damage: 8, cooldown: 28, splash: 0, slow: 0, projSpeed: 7, crit: 0.18 },
      { cost: 55, range: 150, damage: 14, cooldown: 24, splash: 0, slow: 0, projSpeed: 8, crit: 0.22 },
      { cost: 90, range: 175, damage: 24, cooldown: 20, splash: 0, slow: 0, projSpeed: 9, crit: 0.28 },
    ],
  },
  {
    key: "cañon",
    name: "Cañón",
    color: "#ef476f",
    proj: "#ff8fa3",
    desc: "Lento, alto daño, área",
    targeting: "first",
    levels: [
      { cost: 100, range: 110, damage: 34, cooldown: 90, splash: 45, slow: 0, projSpeed: 5, crit: 0.08 },
      { cost: 110, range: 120, damage: 56, cooldown: 82, splash: 55, slow: 0, projSpeed: 5, crit: 0.1 },
      { cost: 170, range: 135, damage: 90, cooldown: 72, splash: 70, slow: 0, projSpeed: 6, crit: 0.12 },
    ],
  },
  {
    key: "hielo",
    name: "Hielo",
    color: "#a0c4ff",
    proj: "#dbeaff",
    desc: "Ralentiza a los enemigos",
    targeting: "first",
    levels: [
      { cost: 75, range: 115, damage: 4, cooldown: 45, splash: 0, slow: 0.5, projSpeed: 6, crit: 0.05 },
      { cost: 80, range: 125, damage: 7, cooldown: 40, splash: 0, slow: 0.62, projSpeed: 6, crit: 0.07 },
      { cost: 120, range: 140, damage: 11, cooldown: 34, splash: 0, slow: 0.72, projSpeed: 7, crit: 0.1 },
    ],
  },
  {
    key: "fuego",
    name: "Fuego",
    color: "#ff9e00",
    proj: "#ffd166",
    desc: "Quemadura continua (DoT)",
    targeting: "first",
    levels: [
      { cost: 90, range: 120, damage: 6, cooldown: 40, splash: 28, slow: 0, projSpeed: 6, burn: 4, burnTime: 120, crit: 0.1 },
      { cost: 100, range: 130, damage: 10, cooldown: 36, splash: 34, slow: 0, projSpeed: 6, burn: 7, burnTime: 130, crit: 0.12 },
      { cost: 150, range: 145, damage: 16, cooldown: 30, splash: 42, slow: 0, projSpeed: 7, burn: 11, burnTime: 140, crit: 0.15 },
    ],
  },
];

export function towerStats(typeIndex, level) {
  const t = TOWER_TYPES[typeIndex];
  return { ...t.levels[level], name: t.name, color: t.color, proj: t.proj, key: t.key };
}

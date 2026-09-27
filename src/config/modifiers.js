export const MODIFIERS = [
  {
    id: "hp_up",
    name: "Furia enemiga",
    icon: "☠",
    desc: "Enemigos +30% HP",
    difficulty: 2,
    reward: 0.2,
    apply: (s) => { s.mods.enemyHpMult *= 1.3; },
  },
  {
    id: "swift",
    name: "Velocidad letal",
    icon: "⚡",
    desc: "Enemigos +20% velocidad",
    difficulty: 2,
    reward: 0.15,
    apply: (s) => { s.mods.enemySpeedMult *= 1.2; },
  },
  {
    id: "armored",
    name: "Blindaje extra",
    icon: "🛡",
    desc: "Enemigos +0.1 armadura",
    difficulty: 1,
    reward: 0.1,
    apply: (s) => { s.mods.enemyArmorAdd += 0.1; },
  },
  {
    id: "swarm",
    name: "Enjambre",
    icon: "🐛",
    desc: "+25% enemigos por oleada",
    difficulty: 2,
    reward: 0.2,
    apply: (s) => { s.mods.spawnMult *= 1.25; },
  },
  {
    id: "gold_rush",
    name: "Filón de oro",
    icon: "💰",
    desc: "+50% oro obtenido",
    difficulty: 0,
    reward: 0.5,
    apply: (s) => { s.mods.goldMult *= 1.5; },
  },
  {
    id: "haste",
    name: "Sobrecalentamiento",
    icon: "🔥",
    desc: "Torres +20% velocidad de ataque",
    difficulty: 0,
    reward: 0.2,
    apply: (s) => { s.mods.towerCdMult *= 0.8; },
  },
  {
    id: "wildfire",
    name: "Rastro de fuego",
    icon: "🌋",
    desc: "Enemigos dejan fuego que daña a otros enemigos",
    difficulty: 0,
    reward: 0.25,
    apply: (s) => { s.mods.enemyFire = true; },
  },
  {
    id: "glass",
    name: "Cristal",
    icon: "💎",
    desc: "Torres +40% daño, -15% alcance",
    difficulty: 0,
    reward: 0.3,
    apply: (s) => { s.mods.towerDmgMult *= 1.4; s.mods.towerRangeMult *= 0.85; },
  },
];

export function baseMods() {
  return {
    enemyHpMult: 1,
    enemySpeedMult: 1,
    enemyArmorAdd: 0,
    spawnMult: 1,
    goldMult: 1,
    towerCdMult: 1,
    towerDmgMult: 1,
    towerRangeMult: 1,
    enemyFire: false,
  };
}

export function modifierById(id) {
  return MODIFIERS.find((m) => m.id === id);
}

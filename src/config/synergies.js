export const SYNERGIES = [
  {
    id: "thermal",
    name: "Choque térmico",
    requires: ["hielo", "fuego"],
    desc: "Fuego +30% daño · Hielo +20% ralentización",
    apply: (m) => {
      m.fuego.dmgMult *= 1.3;
      m.hielo.slowMult *= 1.2;
    },
  },
  {
    id: "artillery",
    name: "Artillería coordinada",
    requires: ["arco", "cañon"],
    desc: "Arco +15% daño · Cañón +15% área",
    apply: (m) => {
      m.arco.dmgMult *= 1.15;
      m.cañon.splashMult *= 1.15;
    },
  },
  {
    id: "frostshot",
    name: "Puntería helada",
    requires: ["hielo", "arco"],
    desc: "Arco +25% crítico",
    apply: (m) => {
      m.arco.critAdd += 0.25;
    },
  },
  {
    id: "firestorm",
    name: "Lluvia de fuego",
    requires: ["cañon", "fuego"],
    desc: "Cañón +15% daño",
    apply: (m) => {
      m.cañon.dmgMult *= 1.15;
    },
  },
];

export function blankMods() {
  const t = () => ({ dmgMult: 1, splashMult: 1, slowMult: 1, critAdd: 0 });
  return { arco: t(), cañon: t(), hielo: t(), fuego: t() };
}

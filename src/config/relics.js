export const RELICS = [
  {
    id: "nucleo_guerra",
    name: "Núcleo de guerra",
    icon: "⚔",
    desc: "+15% daño de torres",
    apply: (s) => { s.relics.dmgMult *= 1.15; },
  },
  {
    id: "corazon_dorado",
    name: "Corazón dorado",
    icon: "💰",
    desc: "+20% oro obtenido",
    apply: (s) => { s.relics.goldMult *= 1.2; },
  },
  {
    id: "fragmento_glacial",
    name: "Fragmento glacial",
    icon: "❄",
    desc: "+10% duración de ralentización",
    apply: (s) => { s.relics.slowMult *= 1.1; },
  },
  {
    id: "engranaje_veloz",
    name: "Engranaje veloz",
    icon: "🔧",
    desc: "+12% velocidad de ataque (-12% enfriamiento)",
    apply: (s) => { s.relics.cdMult *= 0.88; },
  },
  {
    id: "ojo_critico",
    name: "Ojo crítico",
    icon: "🎯",
    desc: "+5% probabilidad de crítico",
    apply: (s) => { s.relics.critAdd += 0.05; },
  },
  {
    id: "prisma_distancia",
    name: "Prisma de alcance",
    icon: "🔭",
    desc: "+10% alcance de torres",
    apply: (s) => { s.relics.rangeMult *= 1.1; },
  },
  {
    id: "corazon_vital",
    name: "Corazón vital",
    icon: "💗",
    desc: "+5 vida de base",
    apply: (s) => { s.vida += 5; s.vidaMax += 5; },
  },
  {
    id: "esencia_ardiente",
    name: "Esencia ardiente",
    icon: "🔥",
    desc: "+20% daño de quemadura",
    apply: (s) => { s.relics.burnMult *= 1.2; },
  },
];

export function relicById(id) {
  return RELICS.find((r) => r.id === id);
}

export function randomRelics(count = 3) {
  const pool = [...RELICS];
  const out = [];
  while (out.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

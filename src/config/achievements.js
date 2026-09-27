export const ACHIEVEMENTS = [
  {
    id: "first_win",
    name: "Primera defensa",
    desc: "Completa cualquier mapa",
    test: (s) => s.victory,
  },
  {
    id: "flawless",
    name: "Sin un rasguño",
    desc: "Gana sin perder vidas",
    test: (s) => s.victory && s.vida === s.vidaMax,
  },
  {
    id: "boss_slayer",
    name: "Cazador de jefes",
    desc: "Derrota 10 jefes",
    test: (s) => (s.stats.bosses || 0) >= 10,
  },
  {
    id: "elite_hunter",
    name: "Cazador de élites",
    desc: "Elimina 25 enemigos élite",
    test: (s) => (s.stats.elites || 0) >= 25,
  },
  {
    id: "wave50",
    name: "Superviviente",
    desc: "Alcanza la oleada 50 (infinito)",
    test: (s) => s.oleada >= 50,
  },
  {
    id: "rich",
    name: "Acumulador",
    desc: "Consigue 5.000 de oro en una partida",
    test: (s) => (s.stats.maxOro || 0) >= 5000,
  },
  {
    id: "slaughter",
    name: "Carnicero",
    desc: "Elimina 1.000 enemigos",
    test: (s) => (s.stats.kills || 0) >= 1000,
  },
];

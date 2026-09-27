export const EVENTS = [
  {
    id: "storm",
    name: "Tormenta",
    icon: "⛈",
    desc: "Los proyectiles van un 30% más lentos",
    duration: 900,
    start: (s) => { s.eventMods.projSpeedMult = 0.7; },
    end: (s) => { s.eventMods.projSpeedMult = 1; },
  },
  {
    id: "meteor",
    name: "Lluvia de meteoros",
    icon: "☄",
    desc: "Los enemigos reciben daño aleatorio",
    duration: 900,
    start: () => {},
    end: () => {},
  },
  {
    id: "eclipse",
    name: "Eclipse",
    icon: "🌑",
    desc: "Los enemigos son un 25% más rápidos",
    duration: 900,
    start: (s) => { s.eventMods.enemySpeedMult = 1.25; },
    end: (s) => { s.eventMods.enemySpeedMult = 1; },
  },
];

export function randomEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

export const ABILITIES = [
  { id: "rayo", name: "Rayo", key: "KeyF", cooldown: 8, color: "#ffd166", desc: "Golpea a los 5 enemigos más avanzados" },
  { id: "meteoro", name: "Meteorito", key: "KeyG", cooldown: 14, color: "#ff9e00", desc: "Daño en área sobre el grupo más denso" },
  { id: "freeze", name: "Congelación", key: "KeyH", cooldown: 18, color: "#a0c4ff", desc: "Ralentiza a todos los enemigos" },
  { id: "gold", name: "Bono de oro", key: "KeyB", cooldown: 25, color: "#ffd166", desc: "Oro instantáneo" },
  { id: "shield", name: "Escudo", key: "KeyN", cooldown: 30, color: "#4cc9f0", desc: "La base es inmune 10s" },
];

export function getAbility(id) {
  return ABILITIES.find((a) => a.id === id) || null;
}

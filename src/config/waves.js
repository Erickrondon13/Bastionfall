export const TOTAL_WAVES = 10;

const UNLOCKS = {
  rapido: 2,
  tanque: 3,
  volador: 4,
  blindado: 5,
  divisor: 6,
};

function poolFor(n) {
  const pool = ["basico"];
  for (const [type, from] of Object.entries(UNLOCKS)) {
    if (n >= from) pool.push(type);
  }
  return pool;
}

export function buildWave(n, totalWaves = TOTAL_WAVES) {
  const pool = poolFor(n);
  const count = 6 + n * 2;
  const queue = [];

  for (let i = 0; i < count; i++) {
    let type = pool[Math.floor(Math.random() * pool.length)];
    if (n >= 5 && Math.random() < 0.3) type = Math.random() < 0.5 ? "tanque" : "rapido";
    queue.push({ type, delay: 35 });
  }

  // Última oleada del nivel: jefe final.
  if (n === totalWaves) {
    queue.push({ type: "jefe", delay: 60 });
  }

  return queue;
}

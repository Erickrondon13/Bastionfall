import { createEnemy } from "../entities/Enemy.js";

export class SpawnSystem {
  update(state, events) {
    if (!state.oleadaActiva || state.gameOver || state.victory) return;

    if (state.spawnQueue.length > 0) {
      state.spawnTimer--;
      if (state.spawnTimer <= 0) {
        const item = state.spawnQueue.shift();
        const enemy = createEnemy(item.type, state.oleada, state.pathPoints[0], state.hpMult);
        state.enemigos.push(enemy);
        if (item.type === "jefe") events.emit("boss:spawn", { enemy });
        state.spawnTimer = item.delay;
      }
    } else if (state.enemigos.length === 0) {
      state.oleadaActiva = false;
      const bonus = 20 + state.oleada * 5;
      state.oro += bonus;
      events.emit("wave:complete", { wave: state.oleada, bonus });
      if (state.oleada >= state.totalOleadas) {
        state.victory = true;
        events.emit("game:victory", {});
      }
    }
  }
}

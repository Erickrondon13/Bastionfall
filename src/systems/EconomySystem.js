import { createSplitEnemy } from "../entities/Enemy.js";

export class EconomySystem {
  update(state, events) {
    const { enemigos } = state;
    for (let i = enemigos.length - 1; i >= 0; i--) {
      const e = enemigos[i];
      if (e.hp > 0) continue;

      state.oro += e.reward;
      state.stats.kills++;
      state.stats.goldEarned += e.reward;
      if (e.boss) state.stats.bosses++;
      if (e.elite) state.stats.elites++;
      events.emit("enemy:killed", { enemy: e });

      if (e.onDeath === "split") {
        const childHp = Math.max(1, Math.round(e.maxHp * 0.25));
        enemigos.push(createSplitEnemy(e, childHp));
        enemigos.push(createSplitEnemy(e, childHp));
      }
      enemigos.splice(i, 1);
    }
  }
}

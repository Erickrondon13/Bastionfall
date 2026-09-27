import { createSplitEnemy } from "../entities/Enemy.js";

export class EconomySystem {
  update(state, events) {
    const { enemigos } = state;
    const goldMult = ((state.mods && state.mods.goldMult) || 1) * ((state.relics && state.relics.goldMult) || 1);
    const hpMult = (state.mods && state.mods.enemyHpMult) || 1;
    for (let i = enemigos.length - 1; i >= 0; i--) {
      const e = enemigos[i];
      if (e.hp > 0) continue;

      const reward = Math.round(e.reward * goldMult);
      state.oro += reward;
      state.stats.kills++;
      state.stats.goldEarned += reward;
      if (e.boss) state.stats.bosses++;
      if (e.elite) state.stats.elites++;
      events.emit("enemy:killed", { enemy: e });

      if (e.onDeath === "split") {
        const childHp = Math.max(1, Math.round(e.maxHp * 0.25 * hpMult));
        enemigos.push(createSplitEnemy(e, childHp));
        enemigos.push(createSplitEnemy(e, childHp));
      }
      enemigos.splice(i, 1);
    }
  }
}

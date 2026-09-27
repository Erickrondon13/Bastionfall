import { createEnemy } from "../entities/Enemy.js";
import { applyElite, bossTypeFor } from "../config/enemies.js";

export class SpawnSystem {
  update(state, events) {
    if (!state.oleadaActiva || state.gameOver || state.victory) return;

      if (state.spawnQueue.length > 0) {
        state.spawnTimer--;
        if (state.spawnTimer <= 0) {
          const item = state.spawnQueue.shift();
          const type = item.type === "jefe" ? bossTypeFor(state.oleada) : item.type;
          const hpMult = state.hpMult * ((state.mods && state.mods.enemyHpMult) || 1);
          const enemy = createEnemy(type, state.oleada, state.pathPoints[0], hpMult);
          const speedMult = (state.mods && state.mods.enemySpeedMult) || 1;
          enemy.speed *= speedMult;
          enemy.baseSpeed = enemy.speed;
          const armorAdd = (state.mods && state.mods.enemyArmorAdd) || 0;
          enemy.armor = Math.min(0.9, enemy.armor + armorAdd);
          enemy.baseArmor = enemy.armor;
          if (item.type !== "jefe" && state.oleada >= 3) {
            const chance = Math.min(0.35, 0.1 + state.oleada * 0.006);
            if (Math.random() < chance) applyElite(enemy, Math.random, state.oleada >= 10 ? 2 : 1);
          }
          state.enemigos.push(enemy);
          if (item.type === "jefe") events.emit("boss:spawn", { enemy });
          state.spawnTimer = item.delay;
        }
      } else if (state.enemigos.length === 0) {
        state.oleadaActiva = false;
        const goldMult = ((state.mods && state.mods.goldMult) || 1) * ((state.relics && state.relics.goldMult) || 1);
        const bonus = Math.round((20 + state.oleada * 5) * goldMult);
        const interest = Math.min(100, Math.floor(state.oro * 0.05));
        let streak = state.streak || 0;
        let perfect = false;
        let perfectBonus = 0;
        if (state.waveLivesLost === 0) {
          streak++;
          perfect = true;
          perfectBonus = 25 + streak * 10;
        } else {
          streak = 0;
        }
        state.streak = streak;
        state.perfectWaves = (state.perfectWaves || 0) + (perfect ? 1 : 0);
        state.waveLivesLost = 0;
        const total = bonus + interest + perfectBonus;
        state.oro += total;
        events.emit("wave:complete", { wave: state.oleada, bonus, interest, streak, perfect, perfectBonus, total });
        if (state.oleada >= state.totalOleadas) {
          state.victory = true;
          events.emit("game:victory", {});
        }
      }
  }
}

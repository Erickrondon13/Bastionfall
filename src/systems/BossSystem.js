import { createEnemy } from "../entities/Enemy.js";

export class BossSystem {
  update(state, events) {
    if (state.gameOver || state.victory) return;

    for (const e of state.enemigos) {
      if (!e.boss) continue;

      const ratio = e.hp / e.maxHp;
      if (ratio <= 0.33 && e.phase < 3) {
        e.phase = 3;
        this.onPhase(e, events);
      } else if (ratio <= 0.66 && e.phase < 2) {
        e.phase = 2;
        this.onPhase(e, events);
      }

      if (e.shieldTimer > 0) {
        e.shieldTimer--;
        e.armor = 0.6;
      } else {
        e.armor = e.baseArmor;
      }

      e.abilityTimer--;
      if (e.abilityTimer <= 0) {
        this.useAbility(e, state);
        e.abilityTimer = Math.max(120, 360 - e.phase * 80);
      }
    }
  }

  onPhase(e, events) {
    events.emit("boss:phase", { phase: e.phase });
    e.baseSpeed = Math.min(e.baseSpeed * 1.15, 2.2);
    e.armor = Math.min(0.6, e.baseArmor + 0.15 * (e.phase - 1));
  }

  useAbility(e, state) {
    const count = e.phase;
    for (let i = 0; i < count; i++) {
      const add = createEnemy("basico", state.oleada, { x: e.x, y: e.y });
      add.pathIndex = e.pathIndex;
      state.enemigos.push(add);
    }
    e.baseSpeed = Math.min(e.baseSpeed * 1.05, 2.4);
  }
}

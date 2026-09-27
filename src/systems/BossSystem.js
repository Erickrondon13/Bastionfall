import { createEnemy } from "../entities/Enemy.js";

export class BossSystem {
  update(state, events) {
    if (state.gameOver || state.victory) return;

    for (const e of state.enemigos) {
      if (!e.boss) continue;

      e.invisTimer = e.invisTimer || 0;
      if (e.invisTimer > 0) {
        e.invisTimer--;
        e.invisible = true;
      } else {
        e.invisible = false;
      }

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
        this.useAbility(e, state, events);
        e.abilityTimer = Math.max(120, 360 - e.phase * 80);
      }
    }
  }

  onPhase(e, events) {
    events.emit("boss:phase", { phase: e.phase, name: e.name });
    e.baseSpeed = Math.min(e.baseSpeed * (e.bossKind === "colossus" && e.phase >= 3 ? 1.35 : 1.15), 2.4);
    e.armor = Math.min(0.6, e.baseArmor + 0.15 * (e.phase - 1));
  }

  useAbility(e, state, events) {
    const kind = e.bossKind || "colossus";
    const maxIdx = (state.pathPoints ? state.pathPoints.length : 2) - 1;
    if (kind === "colossus") {
      const count = e.phase + 1;
      for (let i = 0; i < count; i++) {
        const add = createEnemy("basico", state.oleada, { x: e.x, y: e.y });
        add.pathIndex = e.pathIndex;
        state.enemigos.push(add);
      }
      e.baseSpeed = Math.min(e.baseSpeed * 1.05, 2.5);
    } else if (kind === "swarm") {
      const count = e.phase + 1;
      for (let i = 0; i < count; i++) {
        const add = createEnemy("divisor", state.oleada, { x: e.x, y: e.y });
        add.pathIndex = e.pathIndex;
        state.enemigos.push(add);
      }
      this.disableRandomTower(state, 200);
      e.pathIndex = Math.min((e.pathIndex || 0) + 2, maxIdx);
    } else if (kind === "void") {
      e.invisTimer = 130;
      e.pathIndex = Math.min((e.pathIndex || 0) + 3, maxIdx);
      state.abilityLockTimer = Math.max(state.abilityLockTimer || 0, 200);
      if (events) events.emit("boss:ability", { name: e.name, kind });
    }
  }

  disableRandomTower(state, frames) {
    const live = state.torres.filter((t) => t.disabledTimer <= 0);
    if (!live.length) return;
    const t = live[Math.floor(Math.random() * live.length)];
    t.disabledTimer = frames;
  }
}

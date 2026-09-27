import { createEnemy } from "../entities/Enemy.js";

export class EnemySystem {
  update(state, events) {
    if (state.gameOver || state.victory) return;
    const { enemigos } = state;
    for (const e of enemigos) {
      if (e.hp <= 0) continue;

      if (e.regen > 0) {
        e.hp = Math.min(e.maxHp, e.hp + e.regen / 60);
      }

      if (e.healRadius > 0) {
        for (const o of enemigos) {
          if (o === e || o.hp <= 0) continue;
          const d = Math.hypot(o.x - e.x, o.y - e.y);
          if (d <= e.healRadius) o.hp = Math.min(o.maxHp, o.hp + e.healRate / 60);
        }
      }

      if (e.summonEvery > 0) {
        e.summonTimer--;
        if (e.summonTimer <= 0) {
          e.summonTimer = e.summonEvery;
          const add = createEnemy("basico", state.oleada, { x: e.x, y: e.y }, state.hpMult);
          add.pathIndex = e.pathIndex;
          enemigos.push(add);
        }
      }
    }
  }
}

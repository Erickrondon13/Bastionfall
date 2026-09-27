export class HazardSystem {
  update(state) {
    if (state.mods && state.mods.enemyFire) {
      for (const e of state.enemigos) {
        if (e.hp <= 0) continue;
        e._fireT = (e._fireT || 0) - 1;
        if (e._fireT <= 0) {
          e._fireT = 24;
          state.hazards.push({ x: e.x, y: e.y, r: 16, timer: 90, dps: 6 });
          if (state.hazards.length > 240) state.hazards.shift();
        }
      }
    }
    for (let i = state.hazards.length - 1; i >= 0; i--) {
      const h = state.hazards[i];
      h.timer--;
      if (h.timer <= 0) {
        state.hazards.splice(i, 1);
        continue;
      }
      for (const e of state.enemigos) {
        if (e.hp > 0 && Math.hypot(e.x - h.x, e.y - h.y) <= h.r) {
          e.hp -= h.dps;
          state.stats.dmgDealt += h.dps;
        }
      }
    }
  }
}

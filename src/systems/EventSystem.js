export class EventSystem {
  update(state, events) {
    const ev = state.activeEvent;
    if (!ev) return;
    ev.timer--;

    if (ev.id === "meteor") {
      ev.tick = (ev.tick || 0) - 1;
      if (ev.tick <= 0) {
        ev.tick = 35;
        const live = state.enemigos.filter((e) => e.hp > 0);
        const hits = Math.min(4, live.length);
        for (let i = 0; i < hits; i++) {
          const e = live[Math.floor(Math.random() * live.length)];
          const d = 25 + state.oleada * 3;
          e.hp -= d;
          state.stats.dmgDealt += d;
          if (state.floaters.length < 120) {
            state.floaters.push({ x: e.x, y: e.y - e.radius, text: String(Math.round(d)), color: "#ff9e00", crit: false, timer: 40 });
          }
        }
      }
    }

    if (ev.timer <= 0) {
      ev.def.end(state);
      state.activeEvent = null;
      events.emit("event:end", { id: ev.id });
    }
  }
}

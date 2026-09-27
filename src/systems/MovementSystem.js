function applyStatus(e) {
  if (e.slowTimer > 0) {
    e.slowTimer--;
    e.speed = e.baseSpeed * 0.45;
  } else {
    e.speed = e.baseSpeed;
  }

  if (e.burnTimer > 0) {
    e.burnTimer--;
    e.hp -= e.burnDamage;
  }
}

function moveAlongPath(e, pathPoints) {
  const target = pathPoints[e.pathIndex + 1];
  if (!target) return true; // llegó
  const dx = target.x - e.x;
  const dy = target.y - e.y;
  const d = Math.hypot(dx, dy);
  const step = e.speed;
  if (d <= step) {
    e.x = target.x;
    e.y = target.y;
    e.pathIndex++;
  } else {
    e.x += (dx / d) * step;
    e.y += (dy / d) * step;
  }
  return false;
}

function moveFlying(e, base) {
  const dx = base.x - e.x;
  const dy = base.y - e.y;
  const d = Math.hypot(dx, dy);
  const step = e.speed;
  if (d <= step) return true;
  e.x += (dx / d) * step;
  e.y += (dy / d) * step;
  return false;
}

export class MovementSystem {
  update(state, events) {
    if (state.gameOver || state.victory) return;
    const { enemigos, pathPoints, base } = state;

    for (let i = enemigos.length - 1; i >= 0; i--) {
      const e = enemigos[i];
      if (e.hp <= 0) continue; // la muerte la gestiona EconomySystem

      applyStatus(e);

      const arrived = e.flying ? moveFlying(e, base) : moveAlongPath(e, pathPoints);
      if (arrived) {
        if (state.baseShield <= 0) state.vida -= e.boss ? 5 : 1;
        else events.emit("base:shield", { enemy: e });
        enemigos.splice(i, 1);
        events.emit("base:hit", { enemy: e });
        if (state.vida <= 0) {
          state.vida = 0;
          state.gameOver = true;
          events.emit("game:over", {});
        }
      }
    }
  }
}

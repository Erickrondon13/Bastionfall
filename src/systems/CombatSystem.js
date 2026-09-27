import { createProjectile } from "../entities/Projectile.js";

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function progress(e, pathPoints, base) {
  if (e.flying) return -dist(e, base);
  const seg = pathPoints[e.pathIndex + 1];
  const dNext = seg ? dist(e, seg) : 0;
  return e.pathIndex * 10000 - dNext;
}

function acquireTarget(tower, enemies, pathPoints, base) {
  let best = null;
  let bestProg = -Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    if (dist(tower, e) > tower.range) continue;
    const p = progress(e, pathPoints, base);
    if (p > bestProg) {
      bestProg = p;
      best = e;
    }
  }
  return best;
}

function applyHit(state, p, target) {
  if (p.splash > 0) {
    for (const e of state.enemigos) {
      if (e.hp <= 0) continue;
      if (dist(p, e) <= p.splash) dealDamage(e, p);
    }
  } else {
    dealDamage(target, p);
  }
}

function dealDamage(e, p) {
  const eff = Math.max(1, p.damage * (1 - e.armor));
  e.hp -= eff;
  if (p.slow > 0) e.slowTimer = Math.max(e.slowTimer, 90);
  if (p.burn > 0) {
    e.burnTimer = p.burnTime;
    e.burnDamage = p.burn;
  }
}

export class CombatSystem {
  constructor() {
    this.pool = [];
  }

  update(state, events) {
    if (state.gameOver || state.victory) return;

    // Torres disparan.
    for (const t of state.torres) {
      if (t.cool > 0) t.cool--;
      if (t.cool <= 0) {
        const target = acquireTarget(t, state.enemigos, state.pathPoints, state.base);
        if (target) {
          t.cool = t.cooldown;
          state.proyectiles.push(this.acquire(t, target));
        }
      }
    }

    // Proyectiles.
    for (let i = state.proyectiles.length - 1; i >= 0; i--) {
      const p = state.proyectiles[i];
      const tgt = p.target;
      if (!tgt || tgt.hp <= 0) {
        state.proyectiles.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      const dx = tgt.x - p.x;
      const dy = tgt.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d <= p.speed) {
        applyHit(state, p, tgt);
        state.proyectiles.splice(i, 1);
        this.pool.push(p);
      } else {
        p.x += (dx / d) * p.speed;
        p.y += (dy / d) * p.speed;
      }
    }
  }

  acquire(tower, target) {
    const p = this.pool.pop();
    if (p) {
      p.x = tower.x;
      p.y = tower.y;
      p.target = target;
      p.speed = tower.projSpeed;
      p.damage = tower.damage;
      p.splash = tower.splash;
      p.slow = tower.slow;
      p.burn = tower.burn;
      p.burnTime = tower.burnTime;
      p.color = tower.proj;
      p.dead = false;
      return p;
    }
    return createProjectile(tower, target);
  }
}

import { createProjectile } from "../entities/Projectile.js";
import { blankMods } from "../config/synergies.js";

function synMods(state, key) {
  return (state.synergyMods && state.synergyMods[key]) || blankMods()[key] || { dmgMult: 1, splashMult: 1, slowMult: 1, critAdd: 0 };
}

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
    if (e.invisible && dist(tower, e) > tower.range * 0.55) continue;
    if (dist(tower, e) > tower.range) continue;
    const p = progress(e, pathPoints, base);
    if (p > bestProg) {
      bestProg = p;
      best = e;
    }
  }
  return best;
}

function pushFloater(state, x, y, text, color, crit) {
  if (state.floaters.length > 120) state.floaters.shift();
  state.floaters.push({ x, y, text: String(text), color, crit: !!crit, timer: 48 });
}

function applyHit(state, p, target) {
  if (p.splash > 0) {
    for (const e of state.enemigos) {
      if (e.hp <= 0) continue;
      if (dist(p, e) <= p.splash) dealDamage(state, e, p);
    }
  } else {
    dealDamage(state, target, p);
  }
}

function dealDamage(state, e, p) {
  let dmg = p.damage;
  let crit = false;
  if (p.crit && Math.random() < p.crit) {
    dmg *= 1.8;
    crit = true;
  }
  let eff = Math.max(1, dmg * (1 - e.armor));
  if (e.shield > 0) {
    const absorbed = Math.min(e.shield, eff);
    e.shield -= absorbed;
    eff -= absorbed;
    if (e.shield <= 0 && !e._shieldBroken) {
      e._shieldBroken = true;
      pushFloater(state, e.x, e.y, "ESCUDO ROTO", "#4cc9f0", false);
    }
  }
  e.hp -= eff;
  e.hitFlash = 5;
  state.stats.dmgDealt += eff;
  if (p.slow > 0) e.slowTimer = Math.max(e.slowTimer, e.slowResist ? Math.round(p.slowDur / 2) : p.slowDur);
  if (p.burn > 0) {
    e.burnTimer = p.burnTime;
    e.burnDamage = p.burn;
  }
  pushFloater(state, e.x, e.y - e.radius, Math.round(dmg), crit ? "#ffd166" : "#ffffff", crit);
}

export class CombatSystem {
  constructor() {
    this.pool = [];
  }

  update(state, events) {
    if (state.gameOver || state.victory) return;

    for (const t of state.torres) {
      if (t.disabledTimer > 0) {
        t.disabledTimer--;
        continue;
      }
      if (t.cool > 0) t.cool--;
      if (t.cool <= 0) {
        const target = acquireTarget(t, state.enemigos, state.pathPoints, state.base);
        if (target) {
          t.cool = t.cooldown;
          t.angle = Math.atan2(target.y - t.y, target.x - t.x);
          state.proyectiles.push(this.acquire(state, t, target));
        }
      }
    }

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

  acquire(state, tower, target) {
    const m = synMods(state, tower.key);
    const dmgMult = m.dmgMult || 1;
    const splashMult = m.splashMult || 1;
    const slowMult = m.slowMult || 1;
    const critAdd = m.critAdd || 0;
    const relicSlow = (state.relics && state.relics.slowMult) || 1;
    const relicBurn = (state.relics && state.relics.burnMult) || 1;
    const p = this.pool.pop();
    if (p) {
      p.x = tower.x;
      p.y = tower.y;
      p.target = target;
      p.speed = tower.projSpeed * ((state.eventMods && state.eventMods.projSpeedMult) || 1);
      p.damage = tower.damage * dmgMult;
      p.splash = tower.splash * splashMult;
      p.slow = tower.slow;
      p.slowDur = (tower.slow > 0 ? 90 : 0) * slowMult * relicSlow;
      p.burn = tower.burn * relicBurn;
      p.burnTime = tower.burnTime;
      p.crit = Math.min(1, (tower.crit || 0) + critAdd);
      p.color = tower.proj;
      p.dead = false;
      return p;
    }
    return createProjectile(tower, target, { dmgMult, splashMult, slowMult, critAdd });
  }
}

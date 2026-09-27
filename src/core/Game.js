import { createState } from "./GameState.js";
import { buildMap } from "../config/maps.js";
import { SpawnSystem } from "../systems/SpawnSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { EconomySystem } from "../systems/EconomySystem.js";
import { BossSystem } from "../systems/BossSystem.js";
import { EnemySystem } from "../systems/EnemySystem.js";
import { AbilitySystem } from "../systems/AbilitySystem.js";
import { SynergySystem } from "../systems/SynergySystem.js";
import { buildWave, TOTAL_WAVES } from "../config/waves.js";
import { MODES, getMode } from "../config/modes.js";
import { generateCavern, tierLabel } from "../config/mapgen.js";
import { ABILITIES, getAbility } from "../config/abilities.js";
import { ACHIEVEMENTS } from "../config/achievements.js";
import { towerStats, TOWER_TYPES } from "../config/towers.js";
import { createTower, upgradeTower, towerUpgradeCost, chooseBranch } from "../entities/Tower.js";
import { computeStars } from "../config/stars.js";
import { EventBus } from "./EventBus.js";
import { CircuitBreaker, IdempotencyGuard, TimeoutError, now } from "./resilience.js";

function progressOf(e, s) {
  if (e.flying) return -Math.hypot(e.x - s.base.x, e.y - s.base.y);
  const seg = s.pathPoints[e.pathIndex + 1];
  const dNext = seg ? Math.hypot(e.x - seg.x, e.y - seg.y) : 0;
  return e.pathIndex * 10000 - dNext;
}

export class Game {
  constructor(canvas, progression) {
    this.canvas = canvas;
    this.progression = progression || null;
    this.events = new EventBus();
    this.systems = [
      new SpawnSystem(),
      new MovementSystem(),
      new BossSystem(),
      new EnemySystem(),
      new SynergySystem(),
      new CombatSystem(),
      new EconomySystem(),
      new AbilitySystem(),
    ];
    this.frameBudgetMs = 12;
    this.awardGuard = new IdempotencyGuard();
    this.onVictory = null;
    this.onGameOver = null;
    this.onCavernNext = null;
    this.cavern = null;
    this._pendingCavernAdvance = false;
    this._lastRewards = null;
    this.events.on("game:victory", () => {
      this.award();
      this.recordResult();
      const rewards = this.progression ? this.progression.addKey() : { keys: 0, chest: false };
      this._lastRewards = { keys: rewards.keys, chest: rewards.chest };
      this.evaluateAchievements();
      if (this.cavern && this.cavern.index < this.cavern.maps.length - 1) {
        this._pendingCavernAdvance = true;
      } else {
        if (this.cavern) {
          const cav = this.progression ? this.progression.recordCavernComplete(this.cavern.label) : { count: 0, milestone: false };
          this._lastRewards.cavern = cav;
        }
        if (this.onVictory) this.onVictory();
      }
    });
    this.events.on("game:over", () => {
      this.award();
      this.evaluateAchievements();
      this.recordEndlessIfNeeded();
      if (this.onGameOver) this.onGameOver();
    });
    this.events.on("game:over", () => {
      this.award();
      if (this.onGameOver) this.onGameOver();
    });
    this.mode = MODES[0];
    this.loadMap("llanura");
    this.paused = true;
  }

  setMode(modeId) {
    this.mode = getMode(modeId);
    this.newGame();
  }

  togglePause() {
    if (this.state.gameOver || this.state.victory) return;
    this.paused = !this.paused;
    if (this.onPause) this.onPause(this.paused);
  }

  start() {
    this.paused = false;
    if (this.onPause) this.onPause(false);
  }

  mods() {
    return this.progression ? this.progression.mods() : { dmg: { arco: 1, cañon: 1, hielo: 1, fuego: 1 }, range: 1 };
  }

  loadMap(id) {
    this.stage = null;
    this.cavern = null;
    this.map = buildMap(id);
    this.buildGuards();
    this.newGame();
  }

  loadStage(stage) {
    this.stage = stage;
    this.cavern = null;
    this.map = buildMap(stage.map);
    this.buildGuards();
    this.newGame();
    this.state.stageId = stage.id;
  }

  startCavern(tier) {
    this.stage = null;
    this.mode = MODES[0];
    this.cavern = generateCavern(tier);
    this.loadGenMap(0);
    this.paused = false;
    if (this.onPause) this.onPause(false);
  }

  loadGenMap(i) {
    const m = this.cavern.maps[i];
    this.map = m;
    this.buildGuards();
    this.newGame();
    this.state.stageId = `caverna-${this.cavern.tier}-${i}`;
    this.state.cavernIndex = i;
    this.state.cavernLabel = this.cavern.label;
    this.state.cavernTotal = this.cavern.maps.length;
  }

  buildGuards() {
    this.systemGuards = this.systems.map((sys) => ({
      sys,
      name: sys.constructor.name,
      cb: new CircuitBreaker({ threshold: 3, cooldownMs: 4000, label: sys.constructor.name }),
    }));
  }

  newGame() {
    this.state = createState(this.map);
    this.state.totalOleadas = this.mode && this.mode.endless
      ? Infinity
      : (this.map.waves || (this.stage ? this.stage.waves : TOTAL_WAVES));
    this.state.endless = !!(this.mode && this.mode.endless);
    this.state.mode = this.mode.id;
    this.state.hpMult = 1 + ((this.map.tier || 1) - 1) * 0.25;
    this.awardGuard.reset();
    this.systemGuards.forEach((g) => g.cb.reset());
    this.state.vidaMax = this.state.vida;
    this.state.time = 0;
    this.state.floaters = [];
    this.state.baseShield = 0;
    this.state.abilityCd = {};
    for (const a of ABILITIES) this.state.abilityCd[a.id] = 0;
    this.state.stats = {
      kills: 0,
      bosses: 0,
      elites: 0,
      dmgDealt: 0,
      goldEarned: 0,
      goldSpent: 0,
      maxOro: 0,
      towersByType: {},
    };
    if (this.progression) {
      const bonus = this.progression.startBonus();
      this.state.oro += bonus.gold;
      this.state.vida += bonus.life;
      this.state.vidaMax += bonus.life;
      this.state.unlocked = TOWER_TYPES.map(t => this.progression.isTowerUnlocked(t.key));
    } else {
      this.state.unlocked = TOWER_TYPES.map(() => true);
    }
    this.setFlash(`Mapa: ${this.map.name}`);
  }

  restart() {
    if (this.cavern) {
      this.cavern.index = 0;
      this.loadGenMap(0);
      this.paused = false;
      if (this.onRestart) this.onRestart();
      return;
    }
    this.newGame();
    this.paused = false;
    if (this.onRestart) this.onRestart();
  }

  award() {
    if (!this.progression) return;
    this.awardGuard.run("award", () => {
      const gain = this.progression.award(this.state.oleada, this.state.victory);
      this.setFlash(`+${gain} esencia`);
    });
  }

  recordResult() {
    if (!this.progression) return;
    const earned = computeStars(this.state);
    this.lastStars = earned;
    if (this.state.stageId) this.progression.recordStage(this.state.stageId, earned);
    else this.progression.recordStars(this.state.map.id, earned);
  }

  setFlash(msg) {
    this.state.flash.msg = msg;
    this.state.flash.timer = 90;
  }

  evaluateAchievements() {
    if (!this.progression) {
      this.newAchievements = [];
      return [];
    }
    const unlocked = this.progression.data.achievements || {};
    const newly = [];
    for (const a of ACHIEVEMENTS) {
      if (unlocked[a.id]) continue;
      try {
        if (a.test(this.state)) newly.push(a);
      } catch {
        /* ignore */
      }
    }
    if (newly.length) {
      for (const a of newly) unlocked[a.id] = true;
      this.progression.data.achievements = unlocked;
      this.progression.save();
    }
    this.newAchievements = newly;
    return newly;
  }

  recordEndlessIfNeeded() {
    if (!this.progression || !this.state.endless) return;
    this.progression.recordEndless(this.state.oleada, this.state.time);
  }

  startWave() {
    const s = this.state;
    if (this.paused || s.oleadaActiva || s.gameOver || s.victory) return;
    s.oleada++;
    s.spawnQueue = buildWave(s.oleada, s.totalOleadas);
    if (s.endless && s.oleada % 10 === 0) s.spawnQueue.push({ type: "jefe", delay: 40 });
    s.spawnTimer = 0;
    s.oleadaActiva = true;
  }

  useAbility(id) {
    const s = this.state;
    if (this.paused || s.gameOver || s.victory) return false;
    const def = getAbility(id);
    if (!def) return false;
    if ((s.abilityCd[id] || 0) > 0) {
      this.setFlash(`${def.name} en enfriamiento`);
      return false;
    }
    if (id === "rayo") {
      const top = [...s.enemigos]
        .filter((e) => e.hp > 0)
        .sort((a, b) => progressOf(b, s) - progressOf(a, s))
        .slice(0, 5);
      for (const e of top) {
        const d = 60 + s.oleada * 4;
        e.hp -= d;
        s.stats.dmgDealt += d;
        this.events.emit("ability:impact", { x: e.x, y: e.y, color: def.color });
      }
    } else if (id === "meteoro") {
      let center = null;
      let best = 0;
      for (const e of s.enemigos) {
        if (e.hp <= 0) continue;
        let n = 0;
        for (const o of s.enemigos) if (o.hp > 0 && Math.hypot(o.x - e.x, o.y - e.y) <= 75) n++;
        if (n > best) {
          best = n;
          center = e;
        }
      }
      if (center) {
        for (const o of s.enemigos) {
          if (o.hp > 0 && Math.hypot(o.x - center.x, o.y - center.y) <= 75) {
            const d = 100 + s.oleada * 5;
            o.hp -= d;
            s.stats.dmgDealt += d;
          }
        }
        this.events.emit("ability:impact", { x: center.x, y: center.y, color: def.color });
      }
    } else if (id === "freeze") {
      for (const e of s.enemigos) if (e.hp > 0) e.slowTimer = Math.max(e.slowTimer, e.slowResist ? 120 : 240);
    } else if (id === "gold") {
      const g = 120 + s.oleada * 5;
      s.oro += g;
      s.stats.goldEarned += g;
      this.setFlash(`+${g} oro`);
    } else if (id === "shield") {
      s.baseShield = 600;
    }
    s.abilityCd[id] = def.cooldown * 60;
    this.events.emit("ability:used", { id });
    return true;
  }

  tryPlaceTower(c, r) {
    const s = this.state;
    if (!s.unlocked[s.selectedTower]) { this.setFlash("Torre bloqueada"); return false; }
    const key = `${c},${r}`;
    if (s.blocked.has(key)) { this.setFlash("No se puede construir en la ruta"); return false; }
    if (c < 0 || r < 0 || c >= s.map.cols || r >= s.map.rows) return false;
    if (s.torres.some(t => t.c === c && t.r === r)) { this.setFlash("Celda ocupada"); return false; }
    const stats = towerStats(s.selectedTower, 0);
    if (s.oro < stats.cost) { this.setFlash("Oro insuficiente"); return false; }
    s.oro -= stats.cost;
    s.stats.goldSpent += stats.cost;
    s.torres.push(createTower(s.selectedTower, c, r, s.map.tile, this.mods()));
    return true;
  }

  selectTowerAt(c, r) {
    const s = this.state;
    const t = s.torres.find(t => t.c === c && t.r === r);
    s.selectedTowerEntity = t || null;
    return t;
  }

  upgradeSelected() {
    const s = this.state;
    const t = s.selectedTowerEntity;
    if (!t) return false;
    if (t.level === 1 && t.branch == null) {
      this.setFlash("Elige una rama (Q/E o botones)");
      return false;
    }
    const cost = towerUpgradeCost(t);
    if (cost == null) { this.setFlash("Nivel máximo"); return false; }
    if (s.oro < cost) { this.setFlash("Oro insuficiente para mejorar"); return false; }
    s.oro -= cost;
    s.stats.goldSpent += cost;
    upgradeTower(t, this.mods());
    this.setFlash(`${t.name} → nivel ${t.level + 1}`);
    return true;
  }

  chooseBranch(which) {
    const s = this.state;
    const t = s.selectedTowerEntity;
    if (!t || t.branch != null || t.level !== 1) return false;
    const b = TOWER_TYPES[t.typeIndex].branches[which];
    if (!b) return false;
    if (s.oro < b.levels[0].cost) {
      this.setFlash("Oro insuficiente para la rama");
      return false;
    }
    s.oro -= b.levels[0].cost;
    s.stats.goldSpent += b.levels[0].cost;
    chooseBranch(t, which, this.mods());
    this.setFlash(`${t.name} → rama ${b.name}`);
    return true;
  }

  sellSelected() {
    const s = this.state;
    const t = s.selectedTowerEntity;
    if (!t) return false;
    const refund = Math.round(t.invested * 0.6);
    s.oro += refund;
    s.torres = s.torres.filter(x => x !== t);
    s.selectedTowerEntity = null;
    this.setFlash(`Vendida (+${refund} oro)`);
    return true;
  }

  update(dt) {
    const s = this.state;
    if (this.paused) return;
    if (s.flash.timer > 0) s.flash.timer--;
    if (!s.gameOver && !s.victory) s.time += 1;

    for (const g of this.systemGuards) {
      if (g.cb.state === "open") {
        if (now() - g.cb.openedAt > g.cb.cooldownMs) {
          g.cb.state = "half-open";
        } else {
          continue;
        }
      }
      const start = now();
      const ok = g.cb.call(() => {
        g.sys.update(s, this.events);
        const dur = now() - start;
        if (dur > this.frameBudgetMs) {
          throw new TimeoutError(g.name, `${dur.toFixed(1)}ms > ${this.frameBudgetMs}ms`);
        }
      });
      if (!ok && g.cb.tripped) {
        this.setFlash(`Sistema ${g.name} desactivado (fallo)`);
      }
    }

    if (this.state.oro > this.state.stats.maxOro) this.state.stats.maxOro = this.state.oro;

    const syn = this.state.activeSynergies || [];
    if (syn.length && JSON.stringify(syn) !== JSON.stringify(this._lastSynergies)) {
      this.setFlash("Sinergia: " + syn.join(", "));
    }
    this._lastSynergies = syn;

    if (this._pendingCavernAdvance && this.cavern) {
      this._pendingCavernAdvance = false;
      this.cavern.index++;
      this.loadGenMap(this.cavern.index);
      this.setFlash(
        `Caverna ${this.cavern.label}: mapa ${this.cavern.index + 1}/${this.cavern.maps.length} completado`
      );
      if (this.onCavernNext) this.onCavernNext(this.cavern);
    }
  }
}

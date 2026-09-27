import { createState } from "./GameState.js";
import { buildMap } from "../config/maps.js";
import { SpawnSystem } from "../systems/SpawnSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { EconomySystem } from "../systems/EconomySystem.js";
import { BossSystem } from "../systems/BossSystem.js";
import { buildWave, TOTAL_WAVES } from "../config/waves.js";
import { MODES, getMode } from "../config/modes.js";
import { generateCavern, tierLabel } from "../config/mapgen.js";
import { towerStats, TOWER_TYPES } from "../config/towers.js";
import { createTower, upgradeTower, towerUpgradeCost } from "../entities/Tower.js";
import { computeStars } from "../config/stars.js";
import { EventBus } from "./EventBus.js";
import { CircuitBreaker, IdempotencyGuard, TimeoutError, now } from "./resilience.js";

export class Game {
  constructor(canvas, progression) {
    this.canvas = canvas;
    this.progression = progression || null;
    this.events = new EventBus();
    this.systems = [
      new SpawnSystem(),
      new MovementSystem(),
      new BossSystem(),
      new CombatSystem(),
      new EconomySystem(),
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
      if (this.cavern && this.cavern.index < this.cavern.maps.length - 1) {
        this._pendingCavernAdvance = true;
      } else {
        if (this.cavern) {
          const cav = this.progression
            ? this.progression.recordCavernComplete(this.cavern.label)
            : { count: 0, milestone: false };
          this._lastRewards.cavern = cav;
        }
        if (this.onVictory) this.onVictory();
      }
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

  startWave() {
    const s = this.state;
    if (this.paused || s.oleadaActiva || s.gameOver || s.victory) return;
    s.oleada++;
    s.spawnQueue = buildWave(s.oleada, s.totalOleadas);
    s.spawnTimer = 0;
    s.oleadaActiva = true;
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
    const cost = towerUpgradeCost(t);
    if (cost == null) { this.setFlash("Nivel máximo"); return false; }
    if (s.oro < cost) { this.setFlash("Oro insuficiente para mejorar"); return false; }
    s.oro -= cost;
    upgradeTower(t, this.mods());
    this.setFlash(`${t.name} → nivel ${t.level + 1}`);
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

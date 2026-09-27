import { createState } from "./GameState.js";
import { buildMap } from "../config/maps.js";
import { SpawnSystem } from "../systems/SpawnSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { EconomySystem } from "../systems/EconomySystem.js";
import { buildWave, TOTAL_WAVES } from "../config/waves.js";
import { towerStats, TOWER_TYPES } from "../config/towers.js";
import { createTower, upgradeTower, towerUpgradeCost } from "../entities/Tower.js";
import { EventBus } from "./EventBus.js";

export class Game {
  constructor(canvas, progression) {
    this.canvas = canvas;
    this.progression = progression || null;
    this.events = new EventBus();
    this.systems = [
      new SpawnSystem(),
      new MovementSystem(),
      new CombatSystem(),
      new EconomySystem(),
    ];
    this.onVictory = null;
    this.onGameOver = null;
    this.events.on("game:victory", () => {
      this.award();
      if (this.onVictory) this.onVictory();
    });
    this.events.on("game:over", () => {
      this.award();
      if (this.onGameOver) this.onGameOver();
    });
    this.loadMap("llanura");
  }

  mods() {
    return this.progression ? this.progression.mods() : { dmg: { arco: 1, cañon: 1, hielo: 1, fuego: 1 }, range: 1 };
  }

  loadMap(id) {
    this.map = buildMap(id);
    this.newGame();
  }

  newGame() {
    this.state = createState(this.map);
    this.state.totalOleadas = TOTAL_WAVES;
    this._awarded = false;
    if (this.progression) {
      const bonus = this.progression.startBonus();
      this.state.oro += bonus.gold;
      this.state.vida += bonus.life;
      this.state.vidaMax = this.state.vida;
      this.state.unlocked = TOWER_TYPES.map(t => this.progression.isTowerUnlocked(t.key));
    } else {
      this.state.unlocked = TOWER_TYPES.map(() => true);
    }
    this.setFlash(`Mapa: ${this.map.name}`);
  }

  restart() {
    this.newGame();
    if (this.onRestart) this.onRestart();
  }

  award() {
    if (!this.progression || this._awarded) return;
    this._awarded = true;
    const gain = this.progression.award(this.state.oleada, this.state.victory);
    this.setFlash(`+${gain} esencia`);
  }

  setFlash(msg) {
    this.state.flash.msg = msg;
    this.state.flash.timer = 90;
  }

  startWave() {
    const s = this.state;
    if (s.oleadaActiva || s.gameOver || s.victory) return;
    s.oleada++;
    s.spawnQueue = buildWave(s.oleada);
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
    if (s.flash.timer > 0) s.flash.timer--;
    for (const sys of this.systems) sys.update(s, this.events);
  }
}

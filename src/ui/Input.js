import { TOWER_TYPES } from "../config/towers.js";

export class Input {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.tile = () => game.state.map.tile;

    canvas.addEventListener("mousemove", (ev) => this.onMove(ev));
    canvas.addEventListener("mouseleave", () => (game.state.hoverCell = null));
    canvas.addEventListener("click", (ev) => this.onClick(ev));

    this.buttons = [...document.querySelectorAll(".tower-btn")];
    this.buttons.forEach(b => {
      b.addEventListener("click", () => {
        game.state.selectedTower = +b.dataset.tower;
        game.state.selectedTowerEntity = null;
      });
    });

    window.addEventListener("keydown", (ev) => this.onKey(ev));
  }

  cellFromEvent(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    return { c: Math.floor(x / this.tile()), r: Math.floor(y / this.tile()) };
  }

  onMove(ev) {
    this.game.state.hoverCell = this.cellFromEvent(ev);
  }

  onClick(ev) {
    const g = this.game;
    const { c, r } = this.cellFromEvent(ev);
    g.state.hoverCell = { c, r };
    // Si hay una torre en esa celda, la seleccionamos (para mejorar/vender).
    if (g.selectTowerAt(c, r)) return;
    g.tryPlaceTower(c, r);
  }

  onKey(ev) {
    const g = this.game;
    const s = g.state;
    if (ev.code === "Digit1") { s.selectedTower = 0; s.selectedTowerEntity = null; }
    else if (ev.code === "Digit2") { s.selectedTower = 1; s.selectedTowerEntity = null; }
    else if (ev.code === "Digit3") { s.selectedTower = 2; s.selectedTowerEntity = null; }
    else if (ev.code === "Digit4") { s.selectedTower = 3; s.selectedTowerEntity = null; }
    else if (ev.code === "Space") { ev.preventDefault(); g.startWave(); }
    else if (ev.code === "KeyU") { g.upgradeSelected(); }
    else if (ev.code === "KeyX") { g.sellSelected(); }
    else if (ev.code === "KeyR") { g.restart(); }
  }
}

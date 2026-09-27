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
        const idx = +b.dataset.tower;
        if (game.state.unlocked && !game.state.unlocked[idx]) { game.setFlash("Torre bloqueada"); return; }
        game.state.selectedTower = idx;
        game.state.selectedTowerEntity = null;
      });
    });

    window.addEventListener("keydown", (ev) => this.onKey(ev));
  }

  cellFromEvent(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (ev.clientX - rect.left) * scaleX;
    const y = (ev.clientY - rect.top) * scaleY;
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
    const pick = (idx) => {
      if (s.unlocked && !s.unlocked[idx]) { g.setFlash("Torre bloqueada"); return; }
      s.selectedTower = idx;
      s.selectedTowerEntity = null;
    };
    if (ev.code === "Digit1") pick(0);
    else if (ev.code === "Digit2") pick(1);
    else if (ev.code === "Digit3") pick(2);
    else if (ev.code === "Digit4") pick(3);
    else if (ev.code === "Space") { ev.preventDefault(); g.startWave(); }
    else if (ev.code === "KeyU") { g.upgradeSelected(); }
    else if (ev.code === "KeyX") { g.sellSelected(); }
    else if (ev.code === "KeyR") { g.restart(); }
    else if (ev.code === "KeyF") { g.useAbility("rayo"); }
    else if (ev.code === "KeyG") { g.useAbility("meteoro"); }
    else if (ev.code === "KeyH") { g.useAbility("freeze"); }
    else if (ev.code === "KeyB") { g.useAbility("gold"); }
    else if (ev.code === "KeyN") { g.useAbility("shield"); }
    else if (ev.code === "KeyQ") { g.chooseBranch("A"); }
    else if (ev.code === "KeyE") { g.chooseBranch("B"); }
    else if (ev.code === "KeyP") { ev.preventDefault(); this.onToggleTech && this.onToggleTech(); }
    else if (ev.code === "KeyC") { ev.preventDefault(); this.onToggleCampaign && this.onToggleCampaign(); }
    else if (ev.code === "KeyM") { ev.preventDefault(); this.onToggleMods && this.onToggleMods(); }
    else if (ev.code === "Escape") { ev.preventDefault(); this.game.togglePause(); }
  }
}

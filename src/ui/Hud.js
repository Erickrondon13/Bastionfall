import { TOWER_TYPES } from "../config/towers.js";

export class Hud {
  constructor(game) {
    this.game = game;
    this.el = {
      vida: document.getElementById("hud-vida"),
      oro: document.getElementById("hud-oro"),
      oleada: document.getElementById("hud-oleada"),
      enemigos: document.getElementById("hud-enemigos"),
      esencia: document.getElementById("hud-esencia"),
      selName: document.getElementById("hud-sel-name"),
      selInfo: document.getElementById("hud-sel-info"),
    };
    this.buttons = [...document.querySelectorAll(".tower-btn")];
  }

  update() {
    const s = this.game.state;
    this.el.vida.textContent = s.vida;
    this.el.oro.textContent = s.oro;
    this.el.oleada.textContent = `${s.oleada} / ${s.totalOleadas}`;
    this.el.enemigos.textContent = s.enemigos.length;
    this.el.esencia.textContent = this.game.progression ? this.game.progression.esencia() : 0;

    this.buttons.forEach(b => {
      const idx = +b.dataset.tower;
      const unlocked = s.unlocked ? s.unlocked[idx] : true;
      b.classList.toggle("active", unlocked && idx === s.selectedTower && !s.selectedTowerEntity);
      const cost = TOWER_TYPES[idx].levels[0].cost;
      b.classList.toggle("disabled", s.oro < cost);
      b.classList.toggle("locked", !unlocked);
    });

    const t = s.selectedTowerEntity;
    if (t) {
      const type = TOWER_TYPES[t.typeIndex];
      const next = type.levels[t.level + 1];
      this.el.selName.textContent = `${t.name} (nivel ${t.level + 1})`;
      this.el.selInfo.textContent = next
        ? `Mejorar: $${next.cost} · Vender: $${Math.round(t.invested * 0.6)}`
        : `Nivel máximo · Vender: $${Math.round(t.invested * 0.6)}`;
    } else {
      const type = TOWER_TYPES[s.selectedTower];
      this.el.selName.textContent = `Construir: ${type.name}`;
      this.el.selInfo.textContent = `Costo: $${type.levels[0].cost}`;
    }
  }
}

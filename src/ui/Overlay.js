import { computeStars, starsToString } from "../config/stars.js";

export class Overlay {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById("overlay");
    this.title = document.getElementById("overlay-title");
    this.text = document.getElementById("overlay-text");
    this.stars = document.getElementById("overlay-stars");
    document.getElementById("overlay-btn").addEventListener("click", () => game.restart());

    game.onVictory = () => {
      const s = game.state;
      const earned = game.lastStars != null ? game.lastStars : computeStars(s);
      const best = game.progression
        ? (s.stageId ? game.progression.bestStars(s.stageId) : game.progression.bestStars(s.map.id))
        : earned;
      const lines = [`Sobreviviste las ${s.totalOleadas} oleadas. Oro final: ${s.oro}`];
      const r = game._lastRewards;
      if (r) {
        lines.push(`Llaves totales: ${r.keys}`);
        if (r.chest) lines.push("¡Cofre abierto! (+40 esencia)");
        if (r.cavern && r.cavern.milestone) lines.push(`¡Hito! 5 cavernas ${s.cavernLabel} completadas (+200 esencia)`);
      }
      this.show("Victoria", lines.join("\n"));
      this.stars.textContent = `${starsToString(earned)}  (mejor: ${starsToString(best)})`;
      this.stars.style.display = "block";
    };
    game.onGameOver = () => {
      this.show("Derrota", `Tu base cayó en la oleada ${game.state.oleada}.`);
      this.stars.style.display = "none";
    };
  }

  show(title, text) {
    this.title.textContent = title;
    this.text.textContent = text;
    this.el.style.display = "flex";
  }

  hide() {
    this.el.style.display = "none";
  }
}

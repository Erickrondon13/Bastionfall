import { computeStars, starsToString } from "../config/stars.js";

export class Overlay {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById("overlay");
    this.title = document.getElementById("overlay-title");
    this.text = document.getElementById("overlay-text");
    this.stats = document.getElementById("overlay-stats");
    this.ach = document.getElementById("overlay-ach");
    this.stars = document.getElementById("overlay-stars");
    document.getElementById("overlay-btn").addEventListener("click", () => game.restart());

    const finish = (s, title, baseText) => {
      const earned = game.lastStars != null ? game.lastStars : computeStars(s);
      const best = game.progression
        ? (s.stageId ? game.progression.bestStars(s.stageId) : game.progression.bestStars(s.map.id))
        : earned;
      const st = s.stats || {};
      const lines = [
        baseText,
        "",
        `Oleadas: ${s.oleada}   Enemigos: ${st.kills || 0}   Jefes: ${st.bosses || 0}`,
        `Daño total: ${Math.round(st.dmgDealt || 0)}`,
        `Oro ganado: ${st.goldEarned || 0}   Oro gastado: ${st.goldSpent || 0}`,
      ];
      if (s.endless) {
        const best2 = game.progression ? game.progression.endlessBest() : { bestWave: 0 };
        lines.push(`Mejor marca infinito: oleada ${best2.bestWave}`);
      }
      this.show(title, lines.join("\n"));
      this.stats.textContent = lines.slice(1).join("\n");
      const newly = game.newAchievements || [];
      this.ach.textContent = newly.length ? "🏆 Logros:\n" + newly.map((a) => `• ${a.name} — ${a.desc}`).join("\n") : "";
      this.stars.textContent = `${starsToString(earned)}  (mejor: ${starsToString(best)})`;
      this.stars.style.display = "block";
    };

    game.onVictory = () => finish(game.state, "Victoria", `Sobreviviste las ${game.state.totalOleadas} oleadas. Oro final: ${game.state.oro}`);
    game.onGameOver = () => finish(game.state, "Derrota", `Tu base cayó en la oleada ${game.state.oleada}.`);
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

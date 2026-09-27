export class Overlay {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById("overlay");
    this.title = document.getElementById("overlay-title");
    this.text = document.getElementById("overlay-text");
    document.getElementById("overlay-btn").addEventListener("click", () => game.restart());
    game.onVictory = () => this.show("Victoria", `Sobreviviste las ${game.state.totalOleadas} oleadas. Oro final: ${game.state.oro}`);
    game.onGameOver = () => this.show("Derrota", `Tu base cayó en la oleada ${game.state.oleada}.`);
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

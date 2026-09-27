import { CAMPAIGN } from "../config/campaign.js";
import { starsToString } from "../config/stars.js";

export class LevelSelect {
  constructor(game, progression) {
    this.game = game;
    this.progression = progression;
    this.root = document.getElementById("campaign");
    this.list = document.getElementById("campaign-list");
    this.open = false;

    document.getElementById("btn-campaign").addEventListener("click", () => this.toggle());
    document.getElementById("campaign-close").addEventListener("click", () => this.toggle());
  }

  toggle() {
    this.open = !this.open;
    this.root.classList.toggle("open", this.open);
    if (this.open) this.render();
  }

  render() {
    this.list.innerHTML = "";

    const title = document.createElement("div");
    title.className = "camp-title";
    title.textContent = "Campaña";
    this.list.append(title);

    CAMPAIGN.forEach((stage, i) => {
      const unlocked = this.progression.isStageUnlocked(i);
      const completed = this.progression.isStageCompleted(stage.id);
      const stars = this.progression.bestStars(stage.id);

      const row = document.createElement("button");
      row.className = "camp-stage" + (unlocked ? "" : " locked") + (completed ? " done" : "");
      row.disabled = !unlocked;

      const name = document.createElement("div");
      name.className = "camp-name";
      name.textContent = unlocked ? stage.name : "🔒 " + stage.name;

      const meta = document.createElement("div");
      meta.className = "camp-meta";
      meta.textContent = `${stage.waves} oleadas · ${starsToString(stars)}`;

      row.append(name, meta);
      if (unlocked) row.addEventListener("click", () => this.choose(stage));
      this.list.append(row);
    });

    const free = document.createElement("div");
    free.className = "camp-title";
    free.textContent = "Modo libre";
    this.list.append(free);

    for (const m of ["llanura", "cañon"]) {
      const row = document.createElement("button");
      row.className = "camp-stage";
      row.textContent = m === "llanura" ? "Llanura Asediada" : "Garganta del Cañón";
      row.addEventListener("click", () => this.chooseMap(m));
      this.list.append(row);
    }
  }

  choose(stage) {
    this.game.loadStage(stage);
    this.close();
  }

  chooseMap(mapId) {
    this.game.loadMap(mapId);
    this.close();
  }

  close() {
    this.open = false;
    this.root.classList.remove("open");
    if (this.game.onRestart) this.game.onRestart();
  }
}

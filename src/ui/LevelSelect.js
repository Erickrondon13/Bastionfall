import { WORLDS, CAMPAIGN } from "../config/campaign.js";
import { TECH_NODES } from "../config/progression.js";
import { starsToString } from "../config/stars.js";

const TOWER_NAMES = { arco: "Arco", cañon: "Cañón", hielo: "Hielo", fuego: "Fuego" };

function rewardLabel(stage) {
  if (!stage.reward) return "";
  const r = stage.reward;
  if (r.type === "tech") {
    const n = TECH_NODES.find((t) => t.id === r.id);
    return "Recompensa: " + (n ? n.name : r.id);
  }
  if (r.type === "tower") return "Recompensa: desbloquea Torre " + (TOWER_NAMES[r.id] || r.id);
  return "";
}

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
    else if (this.onClose) this.onClose();
  }

  render() {
    this.list.innerHTML = "";

    const title = document.createElement("div");
    title.className = "camp-title";
    title.textContent = "Campaña";
    this.list.append(title);

    for (const world of WORLDS) {
      const wt = document.createElement("div");
      wt.className = "camp-world";
      wt.textContent = world.name;
      this.list.append(wt);

      for (const stage of world.stages) {
        const idx = CAMPAIGN.indexOf(stage);
        const unlocked = this.progression.isStageUnlocked(idx);
        const completed = this.progression.isStageCompleted(stage.id);
        const stars = this.progression.bestStars(stage.id);

        const row = document.createElement("button");
        row.className = "camp-stage" + (unlocked ? "" : " locked") + (completed ? " done" : "") + (stage.boss ? " boss" : "");
        row.disabled = !unlocked;

        const name = document.createElement("div");
        name.className = "camp-name";
        name.textContent = unlocked ? stage.name : "🔒 " + stage.name;

        const meta = document.createElement("div");
        meta.className = "camp-meta";
        meta.textContent = `${stage.waves} oleadas · ${starsToString(stars)}`;

        row.append(name, meta);
        const rw = rewardLabel(stage);
        if (rw) {
          const r = document.createElement("div");
          r.className = "camp-reward";
          r.textContent = rw;
          row.append(r);
        }
        if (unlocked) row.addEventListener("click", () => this.choose(stage));
        this.list.append(row);
      }
    }

    const free = document.createElement("div");
    free.className = "camp-title";
    free.textContent = "Modo libre";
    this.list.append(free);

    for (const m of ["llanura", "cañon", "cienagas"]) {
      const row = document.createElement("button");
      row.className = "camp-stage";
      row.textContent = m === "llanura" ? "Llanura Asediada" : m === "cañon" ? "Garganta del Cañón" : "Ciénagas Putrefactas";
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

import { TOWER_TYPES } from "../config/towers.js";
import { ABILITIES } from "../config/abilities.js";

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
      towerStats: document.getElementById("tower-stats"),
      towerBranch: document.getElementById("tower-branch"),
    };
    this.buttons = [...document.querySelectorAll(".tower-btn")];
    this.abilities = [...document.querySelectorAll(".ability-btn")];
    this._branchSig = "";
  }

  update() {
    const s = this.game.state;
    this.el.vida.textContent = s.vida;
    this.el.oro.textContent = s.oro;
    this.el.oleada.textContent = `${s.oleada} / ${Number.isFinite(s.totalOleadas) ? s.totalOleadas : "∞"}`;
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

    const caveTag = s.cavernLabel
      ? `Caverna ${s.cavernLabel} (${s.cavernIndex + 1}/${s.cavernTotal}) · `
      : "";
    const t = s.selectedTowerEntity;
    if (t) {
      const type = TOWER_TYPES[t.typeIndex];
      const next = type.levels[t.level + 1];
      this.el.selName.textContent = `${caveTag}${t.name} (nivel ${t.level + 1})`;
      this.el.selInfo.textContent = next
        ? `Mejorar: $${next.cost} · Vender: $${Math.round(t.invested * 0.6)}`
        : `Nivel máximo · Vender: $${Math.round(t.invested * 0.6)}`;
    } else {
      const type = TOWER_TYPES[s.selectedTower];
      this.el.selName.textContent = `${caveTag}Construir: ${type.name}`;
      this.el.selInfo.textContent = `Costo: $${type.levels[0].cost}`;
    }

    this.updateAbilityBar(s);
    this.updateTowerStats(s);
    this.updateBranch(s);
  }

  updateAbilityBar(s) {
    for (const btn of this.abilities) {
      const id = btn.dataset.ability;
      const cd = s.abilityCd[id] || 0;
      const cdEl = btn.querySelector(".ab-cd");
      if (cd > 0) {
        btn.classList.add("cooling");
        if (cdEl) cdEl.textContent = (cd / 60).toFixed(1) + "s";
      } else {
        btn.classList.remove("cooling");
        if (cdEl) cdEl.textContent = "";
      }
    }
  }

  updateTowerStats(s) {
    const t = s.selectedTowerEntity;
    if (t) {
      const sec = (t.cooldown / 60).toFixed(2);
      const crit = (t.crit * 100).toFixed(0);
      const dps = (t.damage / (t.cooldown / 60) * (1 + t.crit * 0.8)).toFixed(1);
      this.el.towerStats.innerHTML =
        `<b>${t.name}</b> nivel ${t.level + 1} · Daño <b>${t.damage}</b> · Vel <b>${sec}s</b> · ` +
        `Alcance <b>${(t.range / 40).toFixed(1)}</b> · Crít <b>${crit}%</b> · DPS <b>${dps}</b>`;
    } else {
      const type = TOWER_TYPES[s.selectedTower];
      const lv = type.levels[0];
      const dps = (lv.damage / (lv.cooldown / 60) * (1 + lv.crit * 0.8)).toFixed(1);
      this.el.towerStats.innerHTML =
        `Construir <b>${type.name}</b> · Daño <b>${lv.damage}</b> · Vel <b>${(lv.cooldown / 60).toFixed(2)}s</b> · ` +
        `Alcance <b>${(lv.range / 40).toFixed(1)}</b> · Crít <b>${(lv.crit * 100).toFixed(0)}%</b> · DPS <b>${dps}</b>`;
    }
  }

  updateBranch(s) {
    const t = s.selectedTowerEntity;
    let html = "";
    if (t && t.level === 1 && !t.branch) {
      const b = TOWER_TYPES[t.typeIndex].branches;
      html =
        `<span class="branch-label">Rama:</span>` +
        Object.entries(b)
          .map(([k, v]) => `<button class="branch-btn" data-branch="${k}">${v.name} <span class="ab-key">$${v.levels[0].cost}</span></button>`)
          .join("");
    }
    this.el.towerBranch.style.display = html ? "flex" : "none";
    if (html !== this._branchSig) {
      this._branchSig = html;
      this.el.towerBranch.innerHTML = html;
      this.el.towerBranch.querySelectorAll(".branch-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.game.chooseBranch(btn.dataset.branch));
      });
    }
  }
}

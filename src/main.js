import { Game } from "./core/Game.js";
import { GameLoop } from "./core/Loop.js";
import { Renderer } from "./render/Renderer.js";
import { Hud } from "./ui/Hud.js";
import { Input } from "./ui/Input.js";
import { Overlay } from "./ui/Overlay.js";
import { Progression } from "./core/Progression.js";
import { TechMenu } from "./ui/TechMenu.js";
import { LevelSelect } from "./ui/LevelSelect.js";
import { Sfx } from "./audio/Sfx.js";
import { ABILITIES } from "./config/abilities.js";
import { Effects } from "./render/Effects.js";
import { MODIFIERS } from "./config/modifiers.js";
import { RELICS, relicById } from "./config/relics.js";

const canvas = document.getElementById("game");
const progression = new Progression();
const game = new Game(canvas, progression);

const effects = new Effects(game.events);
const renderer = new Renderer(canvas, effects);
const hud = new Hud(game);
const overlay = new Overlay(game);
const input = new Input(game, canvas);
const techMenu = new TechMenu(progression);
const levelSelect = new LevelSelect(game, progression);

const abilitiesEl = document.getElementById("abilities");
for (const a of ABILITIES) {
  const btn = document.createElement("button");
  btn.className = "ability-btn";
  btn.dataset.ability = a.id;
  btn.title = a.desc;
  btn.innerHTML = `<span class="ab-name">${a.name}</span> <span class="ab-key">${a.key.replace("Key", "")}</span><span class="ab-cd"></span>`;
  btn.addEventListener("click", () => game.useAbility(a.id));
  abilitiesEl.appendChild(btn);
}
const sfx = new Sfx(game.events, { muted: !progression.soundEnabled() });

const menuEl = document.getElementById("menu");
const soundBtn = document.getElementById("menu-sound");
function setMenu(show) {
  menuEl.classList.toggle("hidden", !show);
}

game.onRestart = () => overlay.hide();
game.onPause = (paused) => {
  if (!game.state.gameOver && !game.state.victory) setMenu(paused);
};

input.onToggleTech = () => { setMenu(false); techMenu.toggle(); };
input.onToggleCampaign = () => { setMenu(false); levelSelect.toggle(); };
techMenu.onClose = () => { if (game.paused) setMenu(true); };
levelSelect.onClose = () => { if (game.paused) setMenu(true); };

document.getElementById("menu-resume").addEventListener("click", () => game.start());
document.getElementById("menu-restart").addEventListener("click", () => {
  techMenu.close();
  levelSelect.close();
  game.restart();
});
document.getElementById("menu-campaign").addEventListener("click", () => {
  setMenu(false);
  levelSelect.toggle();
});

const cavernEl = document.getElementById("cavern");
const cavernList = document.getElementById("cavern-list");
const cavernKeys = document.getElementById("cavern-keys");
const cavernChests = document.getElementById("cavern-chests");
const TIER_DEFS = [
  { tier: 1, desc: "5 mapas sencillos. Ideal para farmear llaves." },
  { tier: 2, desc: "Más enemigos y rutas más largas." },
  { tier: 3, desc: "Blindados frecuentes y más HP." },
  { tier: 4, desc: "Máxima dificultad: mucho HP y oleadas largas." },
];
function refreshCavern() {
  cavernKeys.textContent = progression.keys();
  cavernChests.textContent = progression.chests();
  cavernList.innerHTML = "";
  for (const t of TIER_DEFS) {
    const label = ["básico", "medio", "experto", "avanzado"][t.tier - 1];
    const btn = document.createElement("button");
    btn.className = "cavern-tier";
    btn.innerHTML =
      `<span class="ct-name">${label.charAt(0).toUpperCase() + label.slice(1)}</span>` +
      `<span class="ct-desc">${t.desc}</span>` +
      `<span class="ct-stats">Completadas: ${progression.cavernCount(label)} · Llaves por victoria: 1</span>`;
    btn.addEventListener("click", () => {
      cavernEl.classList.remove("open");
      game.startCavern(t.tier);
    });
    cavernList.appendChild(btn);
  }
}
function toggleCavern(force) {
  const open = force !== undefined ? force : !cavernEl.classList.contains("open");
  cavernEl.classList.toggle("open", open);
  if (open) {
    setMenu(false);
    refreshCavern();
  }
}
document.getElementById("menu-caverns").addEventListener("click", () => toggleCavern(true));
document.getElementById("cavern-close").addEventListener("click", () => toggleCavern(false));
input.onToggleCaverns = () => toggleCavern();
document.getElementById("menu-tech").addEventListener("click", () => {
  setMenu(false);
  techMenu.toggle();
});
function refreshSound() {
  soundBtn.textContent = "Sonido: " + (progression.soundEnabled() ? "On" : "Off");
}
soundBtn.addEventListener("click", () => {
  const on = !progression.soundEnabled();
  progression.setSound(on);
  sfx.setMuted(!on);
  refreshSound();
});
const modeBtns = {
  campaign: document.getElementById("menu-mode-campaign"),
  endless: document.getElementById("menu-mode-endless"),
};
function refreshMode() {
  for (const [id, btn] of Object.entries(modeBtns)) {
    btn.classList.toggle("active", game.mode.id === id);
  }
}
modeBtns.campaign.addEventListener("click", () => { game.setMode("campaign"); refreshMode(); });
modeBtns.endless.addEventListener("click", () => { game.setMode("endless"); refreshMode(); });
refreshSound();
refreshMode();
setMenu(true);
if (progression && !progression.tutorialDone()) {
  game.startTutorial();
}

const modEl = document.getElementById("modifiers");
const modList = document.getElementById("mod-list");
const modSummary = document.getElementById("mod-summary");
function renderMods() {
  modList.innerHTML = "";
  let diff = 0;
  let reward = 0;
  for (const m of MODIFIERS) {
    const active = game.isModActive(m.id);
    if (active) {
      diff += m.difficulty;
      reward += m.reward;
    }
    const card = document.createElement("div");
    card.className = "mod-card" + (active ? " active" : "");
    card.innerHTML =
      `<span class="mc-name">${m.icon} ${m.name}</span>` +
      `<span class="mc-desc">${m.desc}</span>` +
      `<span class="mc-tags">Dificultad: <span class="diff">${"★".repeat(m.difficulty) || "—"}</span> · Recompensa: <span class="rew">+${Math.round(m.reward * 100)}% oro</span></span>`;
    card.addEventListener("click", () => {
      game.toggleMod(m.id);
      renderMods();
    });
    modList.appendChild(card);
  }
  modSummary.innerHTML = `Seleccionados: <b>${diff}</b> ★ de dificultad · <b>+${Math.round(reward * 100)}%</b> oro extra`;
}
function toggleMods(force) {
  const open = force !== undefined ? force : !modEl.classList.contains("open");
  modEl.classList.toggle("open", open);
  if (open) {
    setMenu(false);
    renderMods();
  }
}
document.getElementById("menu-mods").addEventListener("click", () => toggleMods(true));
document.getElementById("modifiers-close").addEventListener("click", () => toggleMods(false));
input.onToggleMods = () => {
  if (modEl.classList.contains("open")) toggleMods(false);
  else toggleMods(true);
};

document.getElementById("menu-tutorial").addEventListener("click", () => {
  setMenu(false);
  game.startTutorial();
});
input.onToggleTutorial = () => game.startTutorial();
document.getElementById("menu-save").addEventListener("click", () => {
  game.saveRun();
  setMenu(true);
});
document.getElementById("menu-continue").addEventListener("click", () => {
  game.continueRun();
  setMenu(false);
});

const relicEl = document.getElementById("relic");
const relicCards = document.getElementById("relic-cards");
game.onRelicOffer = (ids) => {
  relicCards.innerHTML = "";
  for (const id of ids) {
    const r = relicById(id);
    if (!r) continue;
    const card = document.createElement("div");
    card.className = "relic-card";
    card.innerHTML = `<div class="rc-icon">${r.icon}</div><div class="rc-name">${r.name}</div><div class="rc-desc">${r.desc}</div>`;
    card.addEventListener("click", () => {
      relicEl.classList.remove("open");
      game.chooseRelic(id);
    });
    relicCards.appendChild(card);
  }
  relicEl.classList.add("open");
};

document.getElementById("tb-wave").addEventListener("click", () => game.startWave());
document.getElementById("tb-upgrade").addEventListener("click", () => game.upgradeSelected());
document.getElementById("tb-sell").addEventListener("click", () => game.sellSelected());
document.getElementById("tb-pause").addEventListener("click", () => game.togglePause());

const loop = new GameLoop(
  (dt) => {
    game.update(dt);
    effects.update();
    overlay.el.style.display = game.state.gameOver || game.state.victory ? "flex" : "none";
  },
  () => {
    renderer.draw(game.state);
    hud.update();
  }
);

loop.start();

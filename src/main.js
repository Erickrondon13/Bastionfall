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
import { Music } from "./audio/Music.js";
import { ABILITIES } from "./config/abilities.js";
import { Effects } from "./render/Effects.js";
import { MODIFIERS } from "./config/modifiers.js";
import { RELICS, relicById } from "./config/relics.js";
import { renderConfig } from "./config/render.js";
import { Camera } from "./render/Camera.js";
import { Renderer3D } from "./render/Renderer3D.js";

window.__appStarted = true;

let canvas = document.getElementById("game");

function resize() {
  const WORLD_W = 1040;
  const WORLD_H = 720;
  const availW = window.innerWidth - 32;
  const availH = window.innerHeight - 230;
  const ar = WORLD_W / WORLD_H;
  let w = availW;
  let h = w / ar;
  if (h > availH) { h = availH; w = h * ar; }
  w = Math.max(320, Math.floor(w));
  h = Math.round(w / ar);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = w;
  canvas.height = h;
}
resize();
window.addEventListener("resize", resize);

const progression = new Progression();
const game = new Game(canvas, progression);

const effects = new Effects(game.events);
const camera = new Camera(renderConfig);
let renderer = null;
let input = null;
let currentMode = null;
const hud = new Hud(game);
const overlay = new Overlay(game);
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
const music = new Music(sfx);
music.setTrack("menu");

game.events.on("wave:start", () => music.setTrack("gameplay"));
game.events.on("boss:spawn", (e) => {
  music.setTrack("boss");
  const intro = document.getElementById("boss-intro");
  const nameEl = document.getElementById("boss-intro-name");
  if (nameEl) nameEl.textContent = e && e.enemy ? e.enemy.name : "El Devorador";
  if (intro) {
    intro.classList.add("show");
    clearTimeout(intro._t);
    intro._t = setTimeout(() => intro.classList.remove("show"), 2400);
  }
});
game.events.on("boss:phase", (e) => {
  game.setFlash(`¡FASE ${e ? e.phase : 2}!`);
});
game.events.on("wave:complete", () => music.setTrack("gameplay"));
game.events.on("game:victory", () => music.setTrack("victory"));
game.events.on("game:over", () => music.setTrack("defeat"));

const menuEl = document.getElementById("menu");
const soundBtn = document.getElementById("menu-sound");
const viewBtn = document.getElementById("menu-view");
function setMenu(show) {
  menuEl.classList.toggle("hidden", !show);
}

function wireInputHandlers(inp) {
  inp.onToggleTech = () => { setMenu(false); techMenu.toggle(); };
  inp.onToggleCampaign = () => { setMenu(false); levelSelect.toggle(); };
  inp.onToggleCaverns = () => toggleCavern();
  inp.onToggleMods = () => {
    if (modEl.classList.contains("open")) toggleMods(false);
    else toggleMods(true);
  };
  inp.onToggleTutorial = () => game.startTutorial();
  inp.onToggleView = () => setRenderMode(currentMode === "3d" ? "2d" : "3d");
}

function isWebGLAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (_) { return false; }
}

let webglOK = null;
function webglSupported() {
  if (webglOK === null) webglOK = isWebGLAvailable();
  return webglOK;
}

let firstModeSwitch = true;
function setRenderMode(mode) {
  if (mode === currentMode) return;
  if (mode === "3d" && !webglSupported()) {
    if (!firstModeSwitch) game.setFlash("WebGL no disponible en este navegador: usa la vista 2.5D");
    mode = "2d";
  }
  firstModeSwitch = false;
  if (renderer && renderer.dispose) renderer.dispose();

  const old = document.getElementById("game");
  const cv = document.createElement("canvas");
  cv.id = "game";
  old.parentNode.replaceChild(cv, old);
  canvas = cv;
  resize();

  const make2D = () => {
    renderer = new Renderer(canvas, effects, camera);
    input = new Input(game, canvas, camera, renderer);
  };
  const make3D = () => {
    renderer = new Renderer3D(canvas);
    input = new Input(game, canvas, camera, renderer);
  };

  let finalMode = mode;
  try {
    if (mode === "3d") make3D();
    else make2D();
  } catch (err) {
    console.error("3D renderer failed, falling back to 2D:", err);
    try {
      make2D();
      finalMode = "2d";
      if (mode === "3d") game.setFlash("WebGL no disponible: usando vista 2.5D");
    } catch (err2) {
      console.error("2D fallback also failed:", err2);
      return;
    }
  }
  currentMode = finalMode;
  wireInputHandlers(input);
  if (viewBtn) viewBtn.textContent = "Vista: " + (finalMode === "3d" ? "3D" : "2.5D");
}

viewBtn.addEventListener("click", () => {
  setRenderMode(currentMode === "3d" ? "2d" : "3d");
});

game.onRestart = () => overlay.hide();
game.onPause = (paused) => {
  if (!game.state.gameOver && !game.state.victory) setMenu(paused);
  const pb = document.getElementById("btn-pause");
  if (pb) { pb.textContent = paused ? "▶" : "⏸"; pb.classList.toggle("active", paused); }
};

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

document.getElementById("menu-tutorial").addEventListener("click", () => {
  setMenu(false);
  game.startTutorial();
});
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

const speedBtn = document.getElementById("btn-speed");
const pauseCtrlBtn = document.getElementById("btn-pause");
const settingsBtn = document.getElementById("btn-settings");
let speed = 1;
const speeds = [1, 2, 3];
pauseCtrlBtn.addEventListener("click", () => game.togglePause());
speedBtn.addEventListener("click", () => {
  speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
  speedBtn.textContent = speed + "×";
  speedBtn.classList.toggle("active", speed > 1);
  game.setFlash("Velocidad " + speed + "×");
});
settingsBtn.addEventListener("click", () => setMenu(true));

setRenderMode("3d");

function showRenderError(msg) {
  let el = document.getElementById("render-error");
  if (!el) {
    el = document.createElement("div");
    el.id = "render-error";
    el.style.cssText =
      "position:fixed;left:12px;bottom:12px;max-width:60%;z-index:9999;background:rgba(120,0,30,.92);" +
      "color:#fff;font:12px/1.4 monospace;padding:10px 12px;border-radius:8px;white-space:pre-wrap";
    document.body.appendChild(el);
  }
  el.textContent = "Error de render (3D):\n" + msg;
}

let renderFallbackDone = false;
let renderEmptyFrames = 0;
const loop = new GameLoop(
  (dt) => {
    for (let i = 0; i < speed; i++) {
      game.update(dt);
      effects.update(game.state);
    }
    overlay.el.style.display = game.state.gameOver || game.state.victory ? "flex" : "none";
  },
  () => {
    try {
      renderer.draw(game.state);
    } catch (err) {
      console.error("Render frame error:", err);
      showRenderError((err && err.stack) || String(err));
      if (!renderFallbackDone && currentMode === "3d") {
        renderFallbackDone = true;
        try { setRenderMode("2d"); } catch (_) {}
      }
      hud.update();
      return;
    }
    if (currentMode === "3d" && renderer.renderer) {
      const tris = (renderer.renderer.info.render.triangles) || 0;
      if (tris === 0) {
        if (++renderEmptyFrames > 90) showRenderError("El render 3D dibujó 0 triángulos: la cámara no ve geometría o WebGL está limitado en este navegador.");
      } else {
        renderEmptyFrames = 0;
      }
    }
    hud.update();
  }
);

loop.start();

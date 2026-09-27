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

const canvas = document.getElementById("game");
const progression = new Progression();
const game = new Game(canvas, progression);

const renderer = new Renderer(canvas);
const hud = new Hud(game);
const overlay = new Overlay(game);
const input = new Input(game, canvas);
const techMenu = new TechMenu(progression);
const levelSelect = new LevelSelect(game, progression);
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
refreshSound();
setMenu(true);

document.getElementById("tb-wave").addEventListener("click", () => game.startWave());
document.getElementById("tb-upgrade").addEventListener("click", () => game.upgradeSelected());
document.getElementById("tb-sell").addEventListener("click", () => game.sellSelected());
document.getElementById("tb-pause").addEventListener("click", () => game.togglePause());

const loop = new GameLoop(
  (dt) => {
    game.update(dt);
    overlay.el.style.display = game.state.gameOver || game.state.victory ? "flex" : "none";
  },
  () => {
    renderer.draw(game.state);
    hud.update();
  }
);

loop.start();

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
const sfx = new Sfx(game.events);

input.onToggleTech = () => techMenu.toggle();
input.onToggleCampaign = () => levelSelect.toggle();
game.onRestart = () => overlay.hide();

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

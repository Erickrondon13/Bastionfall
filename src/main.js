import { Game } from "./core/Game.js";
import { GameLoop } from "./core/Loop.js";
import { Renderer } from "./render/Renderer.js";
import { Hud } from "./ui/Hud.js";
import { Input } from "./ui/Input.js";
import { Overlay } from "./ui/Overlay.js";

const canvas = document.getElementById("game");
const game = new Game(canvas);

const renderer = new Renderer(canvas);
const hud = new Hud(game);
const overlay = new Overlay(game);
const input = new Input(game, canvas);

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

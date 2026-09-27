import { TOWER_TYPES, towerStats } from "../config/towers.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  draw(state) {
    const ctx = this.ctx;
    const { map, tile } = state;
    const W = map.cols * tile;
    const H = map.rows * tile;

    ctx.clearRect(0, 0, W, H);

    this.drawTerrain(state, W, H, tile);
    this.drawPath(state);
    this.drawBase(state);
    this.drawTowers(state, tile);
    this.drawHover(state, tile);
    this.drawEnemies(state);
    this.drawProjectiles(state);
    this.drawFlash(state);
  }

  drawTerrain(state, W, H, tile) {
    const ctx = this.ctx;
    for (let r = 0; r < state.map.rows; r++) {
      for (let c = 0; c < state.map.cols; c++) {
        const isPath = state.blocked.has(`${c},${r}`);
        ctx.fillStyle = isPath ? "#2b3140" : (c + r) % 2 ? "#161c26" : "#1a212d";
        ctx.fillRect(c * tile, r * tile, tile, tile);
      }
    }
  }

  drawPath(state) {
    const ctx = this.ctx;
    const pts = state.pathPoints;
    ctx.strokeStyle = "#3a4658";
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  drawBase(state) {
    const ctx = this.ctx;
    const b = state.base;
    ctx.fillStyle = "#06d6a0";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#08121a";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⌂", b.x, b.y);
  }

  drawTowers(state, tile) {
    const ctx = this.ctx;
    for (const t of state.torres) {
      const isSel = state.selectedTowerEntity === t;
      if (isSel) {
        ctx.fillStyle = "rgba(255,209,102,.10)";
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#08121a";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.name[0], t.x, t.y);
      // Nivel.
      ctx.fillStyle = "#ffd166";
      ctx.font = "9px sans-serif";
      ctx.fillText("★".repeat(t.level + 1), t.x, t.y + 18);
    }
  }

  drawHover(state, tile) {
    const hc = state.hoverCell;
    if (!hc) return;
    const def = TOWER_TYPES[state.selectedTower];
    const stats = towerStats(state.selectedTower, 0);
    const key = `${hc.c},${hc.r}`;
    const ok = !state.blocked.has(key) && state.oro >= stats.cost &&
      !state.torres.some(t => t.c === hc.c && t.r === hc.r);
    this.ctx.fillStyle = ok ? "rgba(76,201,240,.12)" : "rgba(239,71,111,.12)";
    this.ctx.beginPath();
    this.ctx.arc(hc.c * tile + tile / 2, hc.r * tile + tile / 2, stats.range, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawEnemies(state) {
    const ctx = this.ctx;
    for (const e of state.enemigos) {
      // Sombra para voladores.
      if (e.flying) {
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.ellipse(e.x, e.y + 6, e.radius, e.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // Tinte de estado.
      if (e.burnTimer > 0) {
        ctx.strokeStyle = "#ff9e00";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (e.slowTimer > 0) {
        ctx.strokeStyle = "#a0c4ff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Barra de vida.
      const w = e.radius * 2;
      ctx.fillStyle = "#000";
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 7, w, 4);
      ctx.fillStyle = e.boss ? "#ff006e" : "#06d6a0";
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 7, w * Math.max(0, e.hp / e.maxHp), 4);
    }
  }

  drawProjectiles(state) {
    const ctx = this.ctx;
    for (const p of state.proyectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFlash(state) {
    const ctx = this.ctx;
    const W = state.map.cols * state.map.tile;
    if (state.flash.timer > 0 && state.flash.msg) {
      ctx.fillStyle = `rgba(255,255,255,${state.flash.timer / 120})`;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(state.flash.msg, W / 2, 26);
    }
  }
}

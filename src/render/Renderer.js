import { TOWER_TYPES, towerStats } from "../config/towers.js";
import { ZONE_TYPES } from "../config/maps.js";
import * as art from "./art.js";

export class Renderer {
  constructor(canvas, effects) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.effects = effects || null;
  }

  draw(state) {
    const ctx = this.ctx;
    const map = state.map;
    const tile = map.tile;
    const W = map.cols * tile;
    const H = map.rows * tile;
    const time = state.time || 0;

    const shake = this.effects ? this.effects.shakeOffset() : { x: 0, y: 0 };
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(shake.x, shake.y);

    art.drawTerrain(ctx, W, H, tile, state);
    this.drawZones(state, tile);
    art.drawPath(ctx, state.pathPoints);
    this.drawHazards(state);
    art.drawBase(ctx, state.base, time);
    this.drawHover(state, tile);
    for (const t of state.torres) art.drawTower(ctx, t);
    for (const t of state.torres) {
      if (t.disabledTimer > 0) {
        ctx.strokeStyle = "rgba(239,71,111,.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    for (const e of state.enemigos) art.drawEnemy(ctx, e, time);
    for (const p of state.proyectiles) art.drawProjectile(ctx, p);
    if (this.effects) this.effects.draw(ctx);
    this.drawBossBar(state, W);
    this.drawSelectedRange(state);
    this.drawBaseShield(state);
    this.drawFloaters(state);
    ctx.restore();

    this.drawFlash(state);
  }

  drawHazards(state) {
    const ctx = this.ctx;
    for (const h of state.hazards || []) {
      const a = Math.max(0, Math.min(1, h.timer / 90));
      ctx.fillStyle = `rgba(255,120,40,${0.18 + 0.22 * a})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,200,80,${0.5 * a})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawZones(state, tile) {
    const ctx = this.ctx;
    if (!state.map || !state.map.zones) return;
    for (const z of state.map.zones) {
      const def = ZONE_TYPES[z.type];
      if (!def) continue;
      ctx.fillStyle = def.color + "55";
      ctx.fillRect(z.c * tile, z.r * tile, tile, tile);
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(z.c * tile + 0.5, z.r * tile + 0.5, tile - 1, tile - 1);
    }
  }

  drawSelectedRange(state) {
    const t = state.selectedTowerEntity;
    if (!t) return;
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(76,201,240,.35)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawBaseShield(state) {
    if (state.baseShield <= 0) return;
    const ctx = this.ctx;
    const b = state.base;
    ctx.strokeStyle = `rgba(76,201,240,${0.4 + 0.3 * Math.sin(state.time / 6)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawFloaters(state) {
    const ctx = this.ctx;
    for (let i = state.floaters.length - 1; i >= 0; i--) {
      const f = state.floaters[i];
      f.timer--;
      if (f.timer <= 0) {
        state.floaters.splice(i, 1);
        continue;
      }
      const a = Math.min(1, f.timer / 24);
      ctx.globalAlpha = a;
      ctx.fillStyle = f.color;
      ctx.font = (f.crit ? "bold 14px" : "11px") + " sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y - (48 - f.timer) * 0.5);
    }
    ctx.globalAlpha = 1;
  }

  drawBossBar(state, W) {
    const boss = state.enemigos.find((e) => e.boss);
    if (!boss) return;
    const ctx = this.ctx;
    const bw = Math.min(W - 40, 480);
    const x = (W - bw) / 2;
    const y = 8;
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(x - 2, y - 2, bw + 4, 16);
    ctx.fillStyle = "#3a0d22";
    ctx.fillRect(x, y, bw, 12);
    ctx.fillStyle = boss.shieldTimer > 0 ? "#ff9e00" : "#ff006e";
    ctx.fillRect(x, y, bw * ratio, 12);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`JEFE — fase ${boss.phase}${boss.shieldTimer > 0 ? " (escudo)" : ""}`, W / 2, y + 6);
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

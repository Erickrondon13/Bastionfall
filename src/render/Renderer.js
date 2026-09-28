import { TOWER_TYPES, towerStats } from "../config/towers.js";
import { ZONE_TYPES } from "../config/maps.js";
import { renderConfig } from "../config/render.js";
import * as art from "./art.js";

export class Renderer {
  constructor(canvas, effects, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.effects = effects || null;
    this.camera = camera || null;
    this.ambient = [];
    const W = canvas.width, H = canvas.height;
    for (let i = 0; i < 46; i++) this.ambient.push(this._newEmber(W, H));
    this.terrainCanvas = null;
    this._terrainKey = null;
  }

  _ensureTerrain(state, tile, W, H) {
    const key = (state.map && state.map.id) || (W + "x" + H);
    if (this._terrainKey === key && this.terrainCanvas) return;
    this._terrainKey = key;
    if (typeof document === "undefined") { this.terrainCanvas = null; return; }
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const tctx = c.getContext("2d");
    art.drawTerrain(tctx, W, H, tile, state);
    this.drawZones(tctx, state, tile);
    art.drawPath(tctx, state.pathPoints, state);
    this.terrainCanvas = c;
  }

  _newEmber(W, H) {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vy: 0.2 + Math.random() * 0.5,
      life: 80 + Math.random() * 220,
      size: 0.6 + Math.random() * 1.4,
      seed: Math.random() * 10,
      color: "rgba(255,176,92,1)",
    };
  }

  draw(state) {
    const ctx = this.ctx;
    const map = state.map;
    const tile = map.tile;
    const W = map.cols * tile;
    const H = map.rows * tile;
    const time = state.time || 0;
    const cam = this.camera;
    if (cam) cam.update(W, H, this.canvas.width, this.canvas.height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = (state.map && state.map.lighting && state.map.lighting.ambientColor) || "#0d1117";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (cam) cam.apply(ctx);

    const shake = this.effects ? this.effects.shakeOffset() : { x: 0, y: 0 };
    ctx.translate(shake.x, shake.y);

    this._ensureTerrain(state, tile, W, H);
    if (this.terrainCanvas) ctx.drawImage(this.terrainCanvas, 0, 0);
    else {
      art.drawTerrain(ctx, W, H, tile, state);
      this.drawZones(ctx, state, tile);
      art.drawPath(ctx, state.pathPoints, state);
    }
    this.drawHazards(state);
    this.drawShadows(state);
    art.drawCaveGlow(ctx, state, time);
    this.drawHover(state, tile);

    const iso = cam && cam.config.cameraMode === "isometric";
    const drawables = [];
    drawables.push({ x: state.base.x, y: state.base.y, fn: () => art.drawBase(ctx, state.base, time) });
    for (const t of state.torres) {
      drawables.push({
        x: t.x, y: t.y,
        fn: () => {
          art.drawTower(ctx, t, time);
          if (t.disabledTimer > 0) {
            ctx.strokeStyle = "rgba(239,71,111,.9)";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        },
      });
    }
    for (const e of state.enemigos) drawables.push({ x: e.x, y: e.y, fn: () => art.drawEnemy(ctx, e, time) });
    for (const p of state.proyectiles) drawables.push({ x: p.x, y: p.y, fn: () => art.drawProjectile(ctx, p) });

    drawables.sort((a, b) => (iso ? (a.x + a.y) - (b.x + b.y) : a.y - b.y));
    for (const d of drawables) d.fn();

    if (this.effects) this.effects.draw(ctx);
    this.drawLighting(state, time);
    this.drawSelectedRange(state);
    this.drawBaseShield(state);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (renderConfig.ambient) this.drawAmbient();
    this.drawFloaters(state);
    this.drawVignette();
    this.drawBossBar(state);
    this.drawFlash(state);
  }

  drawShadows(state) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    const ell = (x, y, rx, ry) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    ell(state.base.x, state.base.y + 12, 26, 10);
    for (const t of state.torres) ell(t.x, t.y + 11, 14, 5);
    for (const e of state.enemigos) {
      if (e.flying) ell(e.x, e.y + e.radius * 0.6, e.radius * 0.7, e.radius * 0.3);
      else ell(e.x, e.y + 6, e.radius * 0.9, e.radius * 0.4);
    }
    for (const p of state.proyectiles) ell(p.x, p.y + 5, 4, 2);
  }

  drawLighting(state, time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const t of state.torres) {
      let col = null;
      if (t.typeIndex === 3) col = "255,140,40";
      else if (t.typeIndex === 2) col = "120,200,255";
      if (col) {
        const R = 46;
        const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, R);
        g.addColorStop(0, `rgba(${col},0.22)`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(t.x - R, t.y - R, R * 2, R * 2);
      }
    }
    for (const e of state.enemigos) {
      if (e.burnTimer > 0) {
        const R = e.radius + 8;
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, R);
        g.addColorStop(0, "rgba(255,120,30,0.25)");
        g.addColorStop(1, "rgba(255,120,30,0)");
        ctx.fillStyle = g;
        ctx.fillRect(e.x - R, e.y - R, R * 2, R * 2);
      }
      if (e.boss) {
        const R = e.radius + 26 + 6 * Math.sin(time / 8);
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, R);
        g.addColorStop(0, "rgba(180,23,158,0.18)");
        g.addColorStop(1, "rgba(180,23,158,0)");
        ctx.fillStyle = g;
        ctx.fillRect(e.x - R, e.y - R, R * 2, R * 2);
      }
    }
    ctx.restore();
  }

  drawAmbient() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.ambient) {
      p.y -= p.vy;
      p.x += Math.sin(p.y * 0.02 + p.seed) * 0.3;
      p.life--;
      if (p.y < -10 || p.life <= 0) Object.assign(p, this._newEmber(W, H));
      ctx.globalAlpha = Math.max(0, 0.12 + 0.22 * Math.sin(p.life * 0.08));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawVignette() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
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

  drawZones(ctx, state, tile) {
    if (!state.map || !state.map.zones) return;
    for (const z of state.map.zones) {
      const def = ZONE_TYPES[z.type];
      if (!def) continue;
      const x = z.c * tile, y = z.r * tile;
      if (def.texture === "crystal_cluster") {
        ctx.fillStyle = "rgba(43,27,61,.55)";
        ctx.fillRect(x, y, tile, tile);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(x + tile / 2, y + tile / 2, 0, x + tile / 2, y + tile / 2, tile * 0.8);
        g.addColorStop(0, (def.glowColor || "#b55fe6") + "55");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 6, y - 6, tile + 12, tile + 12);
        ctx.restore();
        const cols = [def.glowColor || "#b55fe6", "#e05cff"];
        for (let i = 0; i < 3; i++) {
          const cx = x + tile / 2 + (i - 1) * 9;
          const cy = y + tile / 2 + (i % 2 ? -4 : 4);
          ctx.fillStyle = cols[i % 2];
          ctx.beginPath();
          ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 3, cy); ctx.lineTo(cx, cy + 3); ctx.lineTo(cx - 3, cy);
          ctx.closePath(); ctx.fill();
        }
      } else if (def.texture === "stone_block") {
        ctx.fillStyle = def.color;
        ctx.fillRect(x + 3, y + 3, tile - 6, tile - 6);
        ctx.fillStyle = "rgba(255,255,255,.08)";
        ctx.fillRect(x + 4, y + 3, tile - 8, 3);
        ctx.strokeStyle = "rgba(0,0,0,.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3.5, y + 3.5, tile - 7, tile - 7);
      } else if (def.texture === "magma_vent") {
        ctx.fillStyle = def.color;
        ctx.fillRect(x, y, tile, tile);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(x + tile / 2, y + tile / 2, 0, x + tile / 2, y + tile / 2, tile * 0.7);
        g.addColorStop(0, (def.glowColor || "#ff4500") + "aa");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 6, y - 6, tile + 12, tile + 12);
        ctx.restore();
        ctx.fillStyle = "#ffcc00";
        ctx.beginPath();
        ctx.arc(x + tile / 2, y + tile / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (def.texture === "wood_scaffolding") {
        ctx.fillStyle = def.color;
        ctx.fillRect(x, y, tile, tile);
        ctx.fillStyle = "rgba(0,0,0,.3)";
        ctx.fillRect(x + 5, y, 3, tile);
        ctx.fillRect(x + tile - 8, y, 3, tile);
        ctx.fillRect(x, y + 5, tile, 3);
        ctx.fillRect(x, y + tile - 8, tile, 3);
        ctx.fillStyle = "rgba(255,255,255,.06)";
        ctx.fillRect(x + 5, y, 3, tile);
      } else {
        ctx.fillStyle = def.color + "55";
        ctx.fillRect(x, y, tile, tile);
      }
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
    const cam = this.camera;
    for (let i = state.floaters.length - 1; i >= 0; i--) {
      const f = state.floaters[i];
      f.timer--;
      if (f.timer <= 0) {
        state.floaters.splice(i, 1);
        continue;
      }
      const a = Math.min(1, f.timer / 24);
      const sx = cam ? cam.worldToScreen(f.x, f.y - (48 - f.timer) * 0.5) : [f.x, f.y - (48 - f.timer) * 0.5];
      ctx.globalAlpha = a;
      ctx.font = `bold ${(f.crit ? 18 : 13) * (cam ? cam.scale : 1)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.strokeText(f.text, sx[0], sx[1]);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, sx[0], sx[1]);
    }
    ctx.globalAlpha = 1;
  }

  drawBossBar(state) {
    const boss = state.enemigos.find((e) => e.boss);
    if (!boss) return;
    const ctx = this.ctx;
    const W = this.canvas.width;
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

    const phases = 3;
    const pw = bw / phases;
    for (let i = 0; i < phases; i++) {
      const on = boss.phase >= i + 1;
      ctx.fillStyle = on ? "#b7179e" : "rgba(255,255,255,.15)";
      ctx.fillRect(x + i * pw + 2, y - 7, pw - 4, 4);
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

  drawFlash(state) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    if (state.flash.timer > 0 && state.flash.msg) {
      ctx.fillStyle = `rgba(255,255,255,${state.flash.timer / 120})`;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(state.flash.msg, W / 2, 26);
    }
  }
}

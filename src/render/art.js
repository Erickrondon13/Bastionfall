import { THEMES } from "../config/maps.js";
import { sprites } from "./sprites.js";
import { towerSpriteKey, decoSpriteKey, enemySpriteKey, terrainKey, starSpriteKey } from "../config/sprites.js";

function hash(c, r) {
  let h = (c * 73856093) ^ (r * 19349663);
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function outline(ctx, color = "rgba(8,12,18,.5)", w = 1.5) {
  ctx.lineWidth = w;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function hillAt(c, r) {
  const v = (Math.sin(c * 0.45) + Math.cos(r * 0.5) + Math.sin((c + r) * 0.28)) / 3;
  return (v + 1) / 2;
}
let _terrainBuf = null;
export function drawTerrain(ctx, W, H, tile, state) {
  const theme = (THEMES[state.map.theme] || THEMES.forest);
  const groundFile = terrainKey(state);
  const gimg = sprites.get(groundFile);
  if (gimg) {
    // Suelo con tile real del pack (hierba o piedra de caverna).
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const jx = gimg.width, jy = gimg.height;
    for (let y = 0; y < H; y += tile) {
      for (let x = 0; x < W; x += tile) {
        const ox = (((x * 7 + y * 3) % 3) - 1) * (jx * 0.04);
        const oy = (((x * 5 + y * 11) % 3) - 1) * (jy * 0.04);
        ctx.drawImage(gimg, x + ox, y + oy, tile + 1, tile + 1);
      }
    }
    ctx.restore();
    drawForestFrame(ctx, W, H, tile, state, theme);
    return;
  }

  // Renderiza el terreno a baja resolución y lo escala con suavizado para
  // difuminar las costuras de los cuadros (más barato y compatible que blur).
  const s = 0.5;
  if (!_terrainBuf) _terrainBuf = document.createElement("canvas");
  const buf = _terrainBuf;
  const bw = Math.max(1, Math.round(W * s)), bh = Math.max(1, Math.round(H * s));
  if (buf.width !== bw || buf.height !== bh) { buf.width = bw; buf.height = bh; }
  const b = buf.getContext("2d");
  b.setTransform(s, 0, 0, s, 0, 0);
  b.clearRect(0, 0, W, H);

  const g = b.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.bgTop);
  g.addColorStop(1, theme.bgBottom);
  b.fillStyle = g;
  b.fillRect(0, 0, W, H);

  const cols = state.map.cols, rows = state.map.rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile, y = r * tile;
      if (state.blocked.has(`${c},${r}`)) continue;
      const hill = Math.max(0, Math.min(1, hillAt(c, r) + (hash(c * 3 + 1, r * 7 + 5) - 0.5) * 0.12));
      const base = lerpColor(theme.terrainLow, theme.terrainHigh, hill);
      const vg = b.createLinearGradient(0, y, 0, y + tile);
      vg.addColorStop(0, shade(base, 12));
      vg.addColorStop(1, shade(base, -10));
      b.fillStyle = vg;
      b.fillRect(x - 0.5, y - 0.5, tile + 1, tile + 1);
    }
  }

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(buf, 0, 0, bw, bh, 0, 0, W, H);
  ctx.restore();

  const hillSpots = [
    [cols * 0.2, rows * 0.3, 1], [cols * 0.72, rows * 0.22, 0],
    [cols * 0.5, rows * 0.72, 1], [cols * 0.85, rows * 0.62, 0], [cols * 0.3, rows * 0.82, 1],
  ];

  for (const [hc, hr, light] of hillSpots) {
    const cx = hc * tile, cy = hr * tile, R = tile * 7;
    const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    hg.addColorStop(0, light ? "rgba(200,220,150,0.30)" : "rgba(20,40,20,0.38)");
    hg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = hg;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  }

  drawForestFrame(ctx, W, H, tile, state, theme);
}

function drawForestFrame(ctx, W, H, tile, state, theme) {
  const cols = state.map.cols, rows = state.map.rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const border = c === 0 || c === cols - 1 || r === 0 || r === rows - 1;
      if (!border) continue;
      const x = c * tile, y = r * tile;
      const s = 0.8 + hash(c * 3 + 1, r * 5 + 2) * 0.9;
      const v = (Math.floor(hash(c * 2 + r, c + r * 3) * 4) % 4) + 1;
      drawTreeVariant(ctx, x + tile / 2, y + tile / 2, s, v, theme);
    }
  }
  for (let c = 0; c < cols; c++) {
    const v1 = (Math.floor(hash(c, 1) * 4) % 4) + 1;
    const v2 = (Math.floor(hash(c, 7) * 4) % 4) + 1;
    drawTreeVariant(ctx, c * tile + hash(c, 1) * tile, -tile * 0.4, 1.1 + hash(c, 2) * 0.7, v1, theme);
    drawTreeVariant(ctx, c * tile + hash(c, 7) * tile, H + tile * 0.4, 1.1 + hash(c, 9) * 0.7, v2, theme);
  }
}

function drawTreeVariant(ctx, x, y, scale, variant, theme) {
  switch (variant) {
    case 1: return drawPine(ctx, x, y, scale, theme);
    case 2: return drawRoundAutumn(ctx, x, y, scale, theme);
    case 3: return drawBushCluster(ctx, x, y, scale, theme);
    default: return drawTallThin(ctx, x, y, scale, theme);
  }
}

function drawPine(ctx, x, y, scale, theme) {
  const trunkH = 12 * scale, trunkW = 4 * scale;
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.beginPath(); ctx.ellipse(x, y + 2, 10 * scale, 3.5 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = theme.treeTrunk;
  ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH + 2);
  for (let i = 0; i < 4; i++) {
    const w = (16 - i * 3) * scale;
    const top = y - trunkH - i * 9 * scale;
    const bot = top + 12 * scale;
    ctx.fillStyle = i % 2 ? "#2f5a2a" : "#274d22";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x - w, bot);
    ctx.lineTo(x + w, bot);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x - w * 0.3, top + 5 * scale);
    ctx.lineTo(x + w * 0.3, top + 5 * scale);
    ctx.closePath();
    ctx.fill();
  }
}

function drawRoundAutumn(ctx, x, y, scale, theme) {
  const trunkH = 14 * scale, trunkW = 5 * scale;
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.beginPath(); ctx.ellipse(x, y + 2, 12 * scale, 4 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = theme.treeTrunk;
  ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH + 2);
  const greens = ["#4a7d39", "#588f42", "#6fa14a"];
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const cx = x + Math.cos(a) * 7 * scale;
    const cy = y - trunkH - 6 * scale + Math.sin(a) * 6 * scale;
    ctx.fillStyle = greens[i % greens.length];
    ctx.beginPath(); ctx.arc(cx, cy, 9 * scale, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 4; i++) {
    const fx = x + (hash(i * 17 + Math.floor(x), Math.floor(y)) - 0.5) * 16 * scale;
    const fy = y - trunkH - 4 * scale + (hash(i * 31 + Math.floor(y), Math.floor(x)) - 0.5) * 14 * scale;
    ctx.fillStyle = "#e8c63a";
    ctx.beginPath(); ctx.arc(fx, fy, 2.2 * scale, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBushCluster(ctx, x, y, scale, theme) {
  ctx.fillStyle = "rgba(0,0,0,.15)";
  ctx.beginPath(); ctx.ellipse(x, y + 3, 12 * scale, 4 * scale, 0, 0, Math.PI * 2); ctx.fill();
  const cols = ["#3c6b30", "#4a7d39", "#2f5a2a"];
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 + 0.3;
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 6 * scale, y - 2 * scale + Math.sin(a) * 3 * scale, (5 + (i % 2) * 2) * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTallThin(ctx, x, y, scale, theme) {
  const trunkH = 26 * scale, trunkW = 3 * scale;
  ctx.fillStyle = "rgba(0,0,0,.20)";
  ctx.beginPath(); ctx.ellipse(x, y + 2, 14 * scale, 4 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = theme.treeTrunk;
  ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH + 2);
  const cy = y - trunkH - 8 * scale;
  ctx.fillStyle = "rgba(74,125,57,0.5)";
  ctx.beginPath(); ctx.arc(x, cy, 13 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(88,143,66,0.6)";
  ctx.beginPath(); ctx.arc(x - 4 * scale, cy - 3 * scale, 9 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.beginPath(); ctx.arc(x - 5 * scale, cy - 5 * scale, 4 * scale, 0, Math.PI * 2); ctx.fill();
}

function drawRockCluster(ctx, x, y, scale, theme) {
  const cols = theme.rock;
  ctx.fillStyle = "rgba(0,0,0,.20)";
  ctx.beginPath(); ctx.ellipse(x, y + 4, 12 * scale, 4 * scale, 0, 0, Math.PI * 2); ctx.fill();
  const stones = [[-6, 0, 5], [4, -2, 6], [-1, -7, 5], [6, -8, 4], [-7, -6, 3]];
  for (const [ox, oy, rr] of stones) {
    const px = x + ox * scale, py = y + oy * scale, s = rr * scale;
    ctx.fillStyle = cols[((ox + oy + 13) % cols.length + cols.length) % cols.length];
    ctx.beginPath();
    ctx.moveTo(px - s, py);
    ctx.lineTo(px - s * 0.5, py - s);
    ctx.lineTo(px + s * 0.4, py - s * 0.8);
    ctx.lineTo(px + s, py);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.beginPath(); ctx.arc(px - s * 0.3, py - s * 0.5, s * 0.3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFlowers(ctx, x, y) {
  for (let i = 0; i < 3; i++) {
    const fx = x + (hash(Math.floor(x) + i, Math.floor(y)) - 0.5) * 14;
    const fy = y + (hash(Math.floor(x) + i + 5, Math.floor(y) + 2) - 0.5) * 10;
    ctx.strokeStyle = "#3f6b2e"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, fy + 4); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.fillStyle = "#f5d442";
    ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGrass(ctx, x, y) {
  ctx.strokeStyle = "#4c7a33"; ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 3, y + 4);
    ctx.lineTo(x + i * 3 + 1, y - 3);
    ctx.stroke();
  }
}

function shade(hex, amt) {
  let r, g, b;
  if (hex.startsWith("rgb")) {
    const m = hex.match(/\d+/g);
    r = +m[0]; g = +m[1]; b = +m[2];
  } else {
    const n = parseInt(hex.slice(1), 16);
    r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255;
  }
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r},${g},${b})`;
}

function drawCaveFrame(ctx, W, H, tile, state) {
  const cols = Math.round(W / tile);
  const rows = Math.round(H / tile);
  const wallTones = ["#23202a", "#2a2632", "#1d1b24", "#26222e"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const border = c === 0 || c === cols - 1 || r === 0 || r === rows - 1;
      if (!border) continue;
      const x = c * tile, y = r * tile;
      const h = hash(c * 7 + 3, r * 5 + 9);
      ctx.fillStyle = wallTones[Math.floor(h * 4) % 4];
      ctx.fillRect(x, y, tile, tile);
      ctx.fillStyle = "rgba(255,255,255,.05)";
      ctx.fillRect(x, y, tile, 3);
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(x, y + tile - 4, tile, 4);
      if (hash(c + 1, r + 2) > 0.7) {
        ctx.strokeStyle = "rgba(0,0,0,.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + tile * 0.4, y + 4);
        ctx.lineTo(x + tile * 0.6, y + tile - 4);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = "#1c1922";
  for (let c = 0; c < cols; c++) {
    const h = hash(c, 99);
    if (h > 0.6) {
      const x = c * tile;
      const drop = 6 + h * 14;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + tile, 0);
      ctx.lineTo(x + tile * 0.5, drop);
      ctx.closePath();
      ctx.fill();
    }
  }

  const beamCols = [0, Math.floor(cols / 2), cols - 1];
  for (const c of beamCols) {
    const x = c * tile + tile / 2 - 4;
    ctx.fillStyle = "#4a3322";
    ctx.fillRect(x, 0, 8, H);
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.fillRect(x, 0, 2, H);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(x + 6, 0, 2, H);
    for (let yy = 40; yy < H; yy += 90) {
      ctx.fillStyle = "#2e2013";
      ctx.fillRect(x - 2, yy, 12, 6);
    }
  }
  ctx.fillStyle = "#4a3322";
  ctx.fillRect(0, 0, W, 8);
  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.fillRect(0, 0, W, 2);

  const crystalSpots = [
    [0, Math.floor(rows * 0.3)], [0, Math.floor(rows * 0.7)],
    [cols - 1, Math.floor(rows * 0.25)], [cols - 1, Math.floor(rows * 0.6)],
    [Math.floor(cols * 0.25), 0], [Math.floor(cols * 0.75), rows - 1],
  ];
  for (const [c, r] of crystalSpots) {
    const x = c * tile + tile / 2;
    const y = r * tile + tile / 2;
    const magenta = hash(c + r, r + c) > 0.5;
    const col = magenta ? "224,92,255" : "183,23,158";
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
    glow.addColorStop(0, `rgba(${col},0.5)`);
    glow.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x - 26, y - 26, 52, 52);
    ctx.save();
    ctx.shadowColor = `rgba(${col},0.9)`;
    ctx.shadowBlur = 16;
    ctx.fillStyle = magenta ? "#e05cff" : "#b7179e";
    ctx.beginPath();
    ctx.moveTo(x, y - 9); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.beginPath();
    ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  const torchSpots = [
    [Math.floor(cols * 0.15), 0], [Math.floor(cols * 0.85), 0],
    [0, Math.floor(rows * 0.5)], [cols - 1, Math.floor(rows * 0.5)],
  ];
  for (const [c, r] of torchSpots) {
    const x = c * tile + tile / 2;
    const y = r * tile + (r === 0 ? tile - 6 : 6);
    ctx.fillStyle = "#2a2422";
    ctx.fillRect(x - 2, y - 6, 4, 10);
    ctx.fillStyle = "#1a1614";
    ctx.fillRect(x - 5, y - 8, 10, 4);
  }
}

function drawCrystalStatic(ctx, x, y, tile, c, r) {
  const cx = x + tile / 2;
  const cy = y + tile * 0.6;
  const col = hash(c, r) > 0.5 ? "#7fd0ff" : "#c77dff";
  ctx.fillStyle = "rgba(10,8,14,.6)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 3, cy);
  ctx.lineTo(cx, cy + 3);
  ctx.lineTo(cx - 3, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.5)";
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

export function drawCaveGlow(ctx, state, time) {
  const tile = state.map.tile;
  const theme = (THEMES[state.map.theme] || THEMES.forest);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const tps = (state.map.lighting && state.map.lighting.torchPoints) || [];
  for (const [c, r] of tps) {
    const x = c * tile + tile / 2;
    const y = r * tile + tile / 2;
    const flick = 0.6 + 0.4 * Math.sin(time / 11 + c * 1.3 + r);
    const R = 34 + flick * 14;
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(${theme.light},${0.22 * flick + 0.05})`);
    g.addColorStop(1, `rgba(${theme.light},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - R, y - R, R * 2, R * 2);
  }
  ctx.restore();
}

export function drawBuildPlatforms(ctx, state, tile) {
  const slots = (state.map && state.map.buildSlots) || [];
  const theme = (THEMES[state.map.theme] || THEMES.forest);
  for (const s of slots) drawBuildPlatform(ctx, s.x, s.y, tile, theme);
}

function drawBuildPlatform(ctx, x, y, tile, theme) {
  const rad = tile * 0.42;
  ctx.fillStyle = "rgba(0,0,0,.30)";
  ctx.beginPath();
  ctx.ellipse(x, y + rad * 0.5, rad * 1.05, rad * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.platform.outer;
  ctx.beginPath(); ctx.ellipse(x, y, rad, rad * 0.78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = theme.platform.ring;
  ctx.beginPath(); ctx.ellipse(x, y, rad * 0.82, rad * 0.64, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = theme.platform.inner;
  ctx.beginPath(); ctx.ellipse(x, y, rad * 0.6, rad * 0.47, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.shadowColor = theme.platform.core;
  ctx.shadowBlur = 14;
  ctx.fillStyle = theme.platform.core;
  ctx.beginPath(); ctx.ellipse(x, y, rad * 0.26, rad * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = theme.platform.core;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(x, y, rad * 0.42, rad * 0.33, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y, rad * 0.5, rad * 0.39, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.beginPath(); ctx.ellipse(x - rad * 0.06, y - rad * 0.05, rad * 0.1, rad * 0.08, 0, 0, Math.PI * 2); ctx.fill();
}

export function drawPath(ctx, pts, state) {
  if (!pts || pts.length < 2) return;
  const theme = (THEMES[state.map.theme] || THEMES.forest);
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i], p2 = pts[i + 1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      if (i === 0) ctx.lineTo(mx, my);
      else ctx.quadraticCurveTo(p1.x, p1.y, mx, my);
    }
    ctx.quadraticCurveTo(pts[pts.length - 1].x, pts[pts.length - 1].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
  };
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = theme.pathDirt;
  ctx.lineWidth = 90;
  trace(); ctx.stroke();

  ctx.save();
  ctx.translate(0, 4);
  ctx.strokeStyle = "rgba(60,40,18,.5)";
  ctx.lineWidth = 72;
  trace(); ctx.stroke();
  ctx.restore();

  const g = ctx.createLinearGradient(0, 0, 0, state.map.rows * state.map.tile);
  g.addColorStop(0, shade(theme.pathCenter, 10));
  g.addColorStop(1, shade(theme.pathEdge, 0));
  ctx.strokeStyle = g;
  ctx.lineWidth = 68;
  trace(); ctx.stroke();

  ctx.strokeStyle = "rgba(255,245,210,.22)";
  ctx.lineWidth = 12;
  trace(); ctx.stroke();

  const sp = pts[0];
  ctx.strokeStyle = "rgba(255,225,150,.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawDecorations(ctx, state) {
  const theme = (THEMES[state.map.theme] || THEMES.forest);
  const decos = state.map.decorations || [];
  for (const d of decos) {
    const key = decoSpriteKey(d.type, d.variant || Math.floor(d.x + d.y));
    const img = sprites.get(key);
    if (img) {
      const size = (d.scale || 1) * 40;
      const s = size / Math.max(1, img.width);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.drawImage(img, (-img.width * s) / 2, (-img.height * s) / 2, img.width * s, img.height * s);
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(d.x, d.y);
    const s = d.scale || 1;
    if (d.type === 1) drawPine(ctx, 0, 0, s, theme);
    else if (d.type === 2) drawRoundAutumn(ctx, 0, 0, s, theme);
    else if (d.type === 3) drawBushCluster(ctx, 0, 0, s, theme);
    else drawRockCluster(ctx, 0, 0, s, theme);
    ctx.restore();
  }
}

// --- Dibujo de mapa orgánico: pradera con gradiente, camino continuo y
// decoraciones variadas (pino / otoño / arbusto / rocas) ---
export function drawOrganicMap(ctx, state, W, H, tile) {
  drawTerrain(ctx, W, H, tile, state);
  drawPath(ctx, state.pathPoints, state);
  drawDecorations(ctx, state);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawBase(ctx, base, time) {
  const x = base.x;
  const y = base.y;
  ctx.fillStyle = "rgba(190,100,255,.12)";
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2a2420";
  ctx.strokeStyle = "#7a6a55";
  ctx.lineWidth = 2;
  const s = 16;
  ctx.beginPath();
  ctx.moveTo(x - s, y + s);
  ctx.lineTo(x - s, y - s + 4);
  ctx.lineTo(x - s + 5, y - s);
  ctx.lineTo(x - s + 5, y - s + 4);
  ctx.lineTo(x + s - 5, y - s + 4);
  ctx.lineTo(x + s - 5, y - s);
  ctx.lineTo(x + s, y - s + 4);
  ctx.lineTo(x + s, y + s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const pulse = 0.5 + 0.5 * Math.sin(time / 9);
  ctx.fillStyle = `rgba(199,125,255,${0.6 + 0.4 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(x, y - s - 2 - pulse * 3);
  ctx.lineTo(x + 5, y - s + 4);
  ctx.lineTo(x, y - s + 7);
  ctx.lineTo(x - 5, y - s + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.5)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

export function drawTower(ctx, t, time = 0) {
  const x = t.x;
  const y = t.y;
  const lvl = t.level + 1;
  const pulse = 0.5 + 0.5 * Math.sin((time || 0) / 10 + x * 0.02);
  const ratio = t.cooldownMax ? t.cooldown / t.cooldownMax : 0;
  const recoil = Math.max(0, ratio);
  const firing = ratio > 0.82;

  const spriteFile = towerSpriteKey(t.typeIndex, t.level);
  const img = sprites.get(spriteFile);

  if (img) {
    const size = 44;
    const s = size / Math.max(1, img.width);
    ctx.save();
    ctx.translate(x, y + 9);
    ctx.drawImage(img, (-img.width * s) / 2, -img.height * s, img.width * s, img.height * s);
    if (firing) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255,180,80,.25)";
      ctx.beginPath();
      ctx.arc(0, -size * 0.3, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a342c";
    roundRect(ctx, -11, 1, 22, 7, 3);
    ctx.fill();
    ctx.fillStyle = "#4a4338";
    roundRect(ctx, -10, 1, 20, 3, 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.4)";
    ctx.lineWidth = 1;
    roundRect(ctx, -11, 1, 22, 7, 3);
    ctx.stroke();

    switch (t.typeIndex) {
      case 0: drawArco(ctx, lvl, pulse, recoil, firing, t.angle, time); break;
      case 1: drawCanon(ctx, lvl, pulse, recoil, firing, t.angle); break;
      case 2: drawHielo(ctx, lvl, pulse, time); break;
      case 3: drawFuego(ctx, lvl, pulse, time); break;
      default: drawArco(ctx, lvl, pulse, recoil, firing, t.angle, time);
    }
    ctx.restore();
  }

  ctx.fillStyle = "#ffd166";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★".repeat(lvl), x, y + 20);
}

function drawArco(ctx, lvl, pulse, recoil, firing, angle, time) {
  ctx.fillStyle = "#5c3a21";
  roundRect(ctx, -13, 0, 26, 6, 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.3)";
  ctx.lineWidth = 1;
  for (let i = -9; i <= 9; i += 5) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 6); ctx.stroke();
  }
  ctx.fillStyle = "#9a8b6a";
  [[-11, 1], [11, 1], [-11, 5], [11, 5]].forEach(([rx, ry]) => {
    ctx.beginPath(); ctx.arc(rx, ry, 1.3, 0, Math.PI * 2); ctx.fill();
  });

  ctx.fillStyle = "#6b4a2b";
  roundRect(ctx, -13, -15, 3, 15, 1);
  ctx.fill();
  ctx.fillStyle = "#3a2616";
  roundRect(ctx, -15, -15, 6, 8, 1);
  ctx.fill();
  ctx.strokeStyle = "#caa472";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-13, -14 + i * 2); ctx.lineTo(-11, -14 + i * 2); ctx.stroke();
  }

  ctx.save();
  ctx.rotate(angle || 0);
  ctx.fillStyle = "#6b4a2b";
  roundRect(ctx, -2, -20, 4, 20, 1);
  ctx.fill();

  ctx.strokeStyle = "#8b5a2b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(4, -14, 8, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();

  ctx.strokeStyle = "rgba(230,237,243,.8)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(4, -22); ctx.stroke();

  const a = 4 + recoil * 3;
  ctx.strokeStyle = "#caa472";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(a, -14); ctx.lineTo(15, -14); ctx.stroke();
  ctx.fillStyle = "#e6edf3";
  ctx.beginPath();
  ctx.moveTo(15, -14);
  ctx.lineTo(12, -12.5);
  ctx.lineTo(12, -15.5);
  ctx.closePath();
  ctx.fill();

  const pg = ctx.createRadialGradient(2, -14, 0, 2, -14, 10);
  pg.addColorStop(0, `rgba(180,120,255,${0.12 + 0.08 * pulse})`);
  pg.addColorStop(1, "rgba(180,120,255,0)");
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(2, -14, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCanon(ctx, lvl, pulse, recoil, firing, angle) {
  ctx.fillStyle = "#4a4a52";
  roundRect(ctx, -12, 0, 24, 6, 2);
  ctx.fill();
  ctx.fillStyle = "#3c3c44";
  roundRect(ctx, -12, 4, 24, 3, 1);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4, 0); ctx.lineTo(-4, 6);
  ctx.moveTo(4, 0); ctx.lineTo(4, 6);
  ctx.stroke();

  ctx.fillStyle = "#2b2b31";
  ctx.beginPath(); ctx.arc(-7, -10, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -10, 3, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.rotate(angle || 0);
  const back = -recoil * 4;
  ctx.fillStyle = "#2b2b31";
  roundRect(ctx, back, -14, 18 + lvl, 8, 3);
  ctx.fill();
  ctx.fillStyle = "#23232a";
  roundRect(ctx, back + 16 + lvl, -16, 4, 12, 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.25)";
  roundRect(ctx, back, -14, 18 + lvl, 2.5, 1);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.5)";
  roundRect(ctx, back + 2, -13.5, 14 + lvl, 1.5, 1);
  ctx.fill();
  if (firing) {
    ctx.fillStyle = "rgba(255,160,40,.95)";
    ctx.beginPath(); ctx.arc(back + 18 + lvl + 2, -10, 4 + lvl, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHielo(ctx, lvl, pulse, time) {
  ctx.fillStyle = "rgba(130,201,229,.5)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  function iceCrystal(cx, cy, h, w, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + w, cy);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx - w, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx - w, cy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.save();
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 15;
  iceCrystal(0, -12, 18 + lvl * 3, 6, "#d0f0fd");
  iceCrystal(-7, -8, 10, 4, "#82c9e5");
  iceCrystal(7, -9, 12, 4, "#82c9e5");
  iceCrystal(-4, -4, 8, 3, "#82c9e5");
  iceCrystal(4, -5, 9, 3, "#d0f0fd");
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const cg = ctx.createRadialGradient(0, -10, 0, 0, -10, 9);
  cg.addColorStop(0, `rgba(0,240,255,${0.3 + 0.2 * pulse})`);
  cg.addColorStop(1, "rgba(0,240,255,0)");
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(0, -10, 9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFuego(ctx, lvl, pulse, time) {
  const blocks = [
    [-11, 2, 10, 5, "#4a4a52"],
    [1, 3, 10, 5, "#353539"],
    [8, 2, 7, 5, "#4a4a52"],
    [-7, -2, 9, 5, "#353539"],
    [3, -2, 9, 5, "#4a4a52"],
    [-2, -6, 8, 5, "#353539"],
  ];
  for (const [bx, by, bw, bh, col] of blocks) {
    ctx.fillStyle = col;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.fillRect(bx, by, bw, 2);
    ctx.strokeStyle = "rgba(0,0,0,.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const ag = ctx.createRadialGradient(0, -8, 0, 0, -8, 22);
  ag.addColorStop(0, "rgba(255,120,30,.25)");
  ag.addColorStop(1, "rgba(255,120,30,0)");
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.arc(0, -8, 22 + lvl, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const fcx = 0;
  const fcy = -9;
  const fr = 13 + lvl * 2 + pulse * 3;
  ctx.save();
  ctx.shadowColor = "#ff6600";
  ctx.shadowBlur = 16 + pulse * 8;
  const fg = ctx.createRadialGradient(fcx, fcy, 0, fcx, fcy, fr);
  fg.addColorStop(0, "#ffff99");
  fg.addColorStop(0.45, "#ff6600");
  fg.addColorStop(1, "#cc0000");
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(fcx, fcy - fr);
  ctx.bezierCurveTo(fcx + fr * 0.6, fcy - fr * 0.3, fcx + fr * 0.5, fcy + fr * 0.4, fcx, fcy + fr * 0.4);
  ctx.bezierCurveTo(fcx - fr * 0.5, fcy + fr * 0.4, fcx - fr * 0.6, fcy - fr * 0.3, fcx, fcy - fr);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawEnemy(ctx, e, time) {
  const bob = Math.sin(time / 8 + e.x * 0.05) * (e.flying ? 2.5 : 1.2);
  const x = e.x;
  const y = e.y + bob;
  const r = e.radius;

  const spriteFile = enemySpriteKey(e.type);
  const img = sprites.get(spriteFile);

  if (img) {
    const size = r * 2.3;
    const s = size / Math.max(1, img.width);
    ctx.save();
    ctx.globalAlpha = e.invisible ? 0.4 : 1;
    ctx.translate(x, y);
    if (e.flying) ctx.translate(0, -4);
    ctx.drawImage(img, (-img.width * s) / 2, (-img.height * s) / 2, img.width * s, img.height * s);
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = e.invisible ? 0.4 : 1;
    ctx.translate(x, y);

    switch (e.type) {
      case "rapido": drawRapido(ctx, r, time, x); break;
      case "tanque": drawTanque(ctx, r); break;
      case "blindado": drawBlindado(ctx, r); break;
      case "volador": drawVolador(ctx, r, time, x); break;
      case "divisor": drawDivisor(ctx, r); break;
      case "jefe": drawJefe(ctx, r, e); break;
      default: drawBasico(ctx, r);
    }

    ctx.restore();
  }

  if (e.hitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, e.hitFlash / 5) * 0.7;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (e.shield > 0) ring(ctx, x, y, r + 4, "#4cc9f0");
  if (e.elite) {
    const star = sprites.get(starSpriteKey());
    if (star) {
      const ss = 11 / Math.max(1, star.width);
      ctx.drawImage(star, x - (star.width * ss) / 2, y - r - 13, star.width * ss, star.height * ss);
    } else {
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★", x, y - r - 9);
    }
  }
  if (e.invisible && !img) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#9b6dde";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.1, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.1, 1.6, 0, Math.PI * 2); ctx.fill();
  }

  if (e.burnTimer > 0) ring(ctx, x, y, r, "#ff9e00");
  else if (e.slowTimer > 0) ring(ctx, x, y, r, "#a0c4ff");

  const w = r * 2;
  ctx.fillStyle = "#000";
  ctx.fillRect(x - w / 2, y - r - 7, w, 4);
  ctx.fillStyle = e.boss ? "#ff006e" : "#06d6a0";
  ctx.fillRect(x - w / 2, y - r - 7, w * Math.max(0, e.hp / e.maxHp), 4);
}

function drawBasico(ctx, r) {
  ctx.fillStyle = "#6b6b73";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.35, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9fe8ff";
  ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.1, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.1, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.05, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.05, 1, 0, Math.PI * 2); ctx.fill();
}

function drawRapido(ctx, r, time, x) {
  const tilt = Math.sin(time / 4 + x * 0.1) * 0.2;
  ctx.rotate(tilt);
  ctx.fillStyle = "#9b5de5";
  ctx.beginPath();
  ctx.moveTo(0, -r - 2);
  ctx.lineTo(r, r);
  ctx.lineTo(-r, r);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.beginPath();
  ctx.moveTo(0, -r + 2);
  ctx.lineTo(r * 0.4, r * 0.4);
  ctx.lineTo(-r * 0.4, r * 0.4);
  ctx.closePath();
  ctx.fill();
}

function drawTanque(ctx, r) {
  ctx.fillStyle = "#8a7a66";
  polygon(ctx, r, 6);
  ctx.fillStyle = "rgba(0,0,0,.25)";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.1, 2.2, 0, Math.PI * 2); ctx.fill();
}

function drawBlindado(ctx, r) {
  ctx.fillStyle = "#5a5e66";
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.strokeStyle = "rgba(8,12,18,.5)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-r, -r, r * 2, r * 2);
  ctx.fillStyle = "rgba(255,255,255,.15)";
  ctx.fillRect(-r, -r, r * 2, 3);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(-r + 3, -r + 3, 3, 3);
  ctx.fillRect(r - 6, -r + 3, 3, 3);
  ctx.fillRect(-r + 3, r - 6, 3, 3);
  ctx.fillRect(r - 6, r - 6, 3, 3);
  ctx.fillStyle = "#d9b36b";
  ctx.fillRect(-r * 0.5, -2, r, 4);
}

function drawVolador(ctx, r, time, x) {
  const flap = Math.sin(time / 3 + x * 0.1) * 0.4;
  ctx.fillStyle = "rgba(160,120,220,.85)";
  ctx.save();
  ctx.rotate(-0.5 - flap);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(-r * 1.6, -r * 0.4); ctx.lineTo(-r * 0.4, r * 0.3);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.5 + flap);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(r * 1.6, -r * 0.4); ctx.lineTo(r * 0.4, r * 0.3);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#c77dff";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.1, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.1, 1.6, 0, Math.PI * 2); ctx.fill();
}

function drawDivisor(ctx, r) {
  ctx.fillStyle = "#48cae4";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
}

function drawJefe(ctx, r, e) {
  const tint = e.color || "#b5179e";
  ctx.fillStyle = "#3a3340";
  polygon(ctx, r, 8);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, "rgba(0,0,0,.45)", 2);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.6, -r * 0.9);
    ctx.lineTo(i * r * 0.3, -r * 1.4);
    ctx.lineTo(i * r * 0.1, -r * 0.9);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#ff006e";
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.05, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.05, 3, 0, Math.PI * 2); ctx.fill();
}

function ring(ctx, x, y, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, Math.PI * 2);
  ctx.stroke();
}

function polygon(ctx, r, n) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function triangle(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, r);
  ctx.lineTo(-r, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawProjectile(ctx, p) {
  const isFire = /f/.test(p.color) || p.color === "#ff8a3d" || p.color === "#ff6a2d";
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7);
  glow.addColorStop(0, p.color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, isFire ? 3 + Math.random() * 1.5 : 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

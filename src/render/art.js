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

export function drawTerrain(ctx, W, H, tile, state) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#16161b");
  g.addColorStop(1, "#0c0c10");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const tones = ["#141418", "#181820", "#101014", "#1a1a22", "#121216", "#0e0e12"];
  for (let r = 0; r < state.map.rows; r++) {
    for (let c = 0; c < state.map.cols; c++) {
      const x = c * tile;
      const y = r * tile;
      if (state.blocked.has(`${c},${r}`)) {
        ctx.fillStyle = "#0e0e12";
        ctx.fillRect(x, y, tile, tile);
        ctx.fillStyle = "rgba(255,255,255,.04)";
        ctx.fillRect(x, y, tile, 2);
        ctx.fillStyle = "rgba(0,0,0,.30)";
        ctx.fillRect(x, y + tile - 3, tile, 3);
        ctx.fillStyle = "rgba(0,0,0,.18)";
        ctx.fillRect(x, y, 2, tile);
        continue;
      }
      const h1 = hash(c, r);
      const h2 = hash(c * 3 + 1, r * 7 + 5);
      ctx.fillStyle = tones[Math.floor(h1 * tones.length) % tones.length];
      ctx.fillRect(x, y, tile, tile);
      ctx.fillStyle = "rgba(255,255,255,.04)";
      ctx.fillRect(x, y, tile, 2);
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(x, y + tile - 3, tile, 3);
      if (h2 > 0.9) {
        ctx.strokeStyle = "rgba(0,0,0,.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + tile * 0.3, y + tile * 0.3);
        ctx.lineTo(x + tile * 0.5, y + tile * 0.7);
        ctx.lineTo(x + tile * 0.7, y + tile * 0.4);
        ctx.stroke();
      }
      if (hash(c * 7 + 2, r * 5 + 3) >= 0.94) drawCrystalStatic(ctx, x, y, tile, c, r);

      const hp = hash(c * 13 + 1, r * 17 + 3);
      if (hp > 0.92) {
        const px = x + 5 + hash(c + 1, r) * (tile - 10);
        const py = y + 5 + hash(c, r + 1) * (tile - 10);
        const gold = hash(c * 2, r) > 0.5;
        const col = gold ? "255,214,120" : "220,235,255";
        const R = 3.5 + hash(c, r * 2) * 3;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, R);
        pg.addColorStop(0, `rgba(${col},0.95)`);
        pg.addColorStop(0.4, `rgba(${col},0.35)`);
        pg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = pg;
        ctx.fillRect(px - R, py - R, R * 2, R * 2);
      }
    }
  }
  drawCaveFrame(ctx, W, H, tile, state);
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
    ctx.fillStyle = magenta ? "#e05cff" : "#b7179e";
    ctx.beginPath();
    ctx.moveTo(x, y - 9); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.beginPath();
    ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y);
    ctx.closePath(); ctx.fill();
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
  const W = state.map.cols * tile;
  const H = state.map.rows * tile;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let r = 0; r < state.map.rows; r++) {
    for (let c = 0; c < state.map.cols; c++) {
      if (state.blocked.has(`${c},${r}`)) continue;
      const hc = hash(c * 7 + 2, r * 5 + 3);
      if (hc < 0.94) continue;
      const x = c * tile + tile / 2;
      const y = r * tile + tile * 0.6;
      const col = hash(c, r) > 0.5 ? "120,180,255" : "190,100,255";
      const pulse = 0.5 + 0.5 * Math.sin(time / 18 + c + r);
      const R = 16 + pulse * 10;
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, `rgba(${col},${0.35 * pulse + 0.15})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - R, y - R, R * 2, R * 2);
    }
  }
  const cols = state.map.cols;
  const rows = state.map.rows;
  const torchSpots = [
    [Math.floor(cols * 0.15), 0], [Math.floor(cols * 0.85), 0],
    [0, Math.floor(rows * 0.5)], [cols - 1, Math.floor(rows * 0.5)],
    [Math.floor(cols * 0.5), rows - 1],
  ];
  for (const [c, r] of torchSpots) {
    const x = c * tile + tile / 2;
    const y = r * tile + (r === 0 ? tile - 6 : 6);
    const flick = 0.5 + 0.5 * Math.sin(time / 9 + c + r * 2) * Math.sin(time / 13 + r);
    const R = 30 + flick * 14;
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(255,170,60,${0.35 * flick + 0.12})`);
    g.addColorStop(1, "rgba(255,170,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - R, y - R, R * 2, R * 2);
    ctx.fillStyle = `rgba(255,${150 + Math.floor(70 * flick)},40,0.9)`;
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 4);
    ctx.quadraticCurveTo(x - 4, y - 6, x, y - 12 * (0.7 + flick * 0.5));
    ctx.quadraticCurveTo(x + 4, y - 6, x + 3, y + 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawPath(ctx, pts, state) {
  if (!pts || pts.length < 2) return;
  const tile = state.map.tile;
  const cols = state.map.cols;
  const rows = state.map.rows;
  const key = (c, r) => c + "," + r;
  const set = new Set();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const steps = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / tile));
    for (let s = 0; s <= steps; s++) {
      const x = a.x + (b.x - a.x) * (s / steps);
      const y = a.y + (b.y - a.y) * (s / steps);
      const c = Math.floor(x / tile);
      const r = Math.floor(y / tile);
      if (c >= 0 && r >= 0 && c < cols && r < rows) set.add(key(c, r));
    }
  }
  const isPath = (c, r) => set.has(key(c, r));

  for (const k of set) {
    const [c, r] = k.split(",").map(Number);
    const x = c * tile;
    const y = r * tile;

    ctx.fillStyle = "rgba(0,0,0,.55)";
    roundRect(ctx, x + 1, y + tile - 6, tile - 2, 7, 4);
    ctx.fill();

    ctx.fillStyle = "#2f2820";
    roundRect(ctx, x + 1, y + tile - 5, tile - 2, 5, 3);
    ctx.fill();

    ctx.fillStyle = "#5a5046";
    roundRect(ctx, x + 2, y + 2, tile - 4, tile - 7, 5);
    ctx.fill();

    ctx.fillStyle = "rgba(255,240,210,.18)";
    ctx.beginPath();
    ctx.moveTo(x + 2, y + tile - 5);
    ctx.lineTo(x + 5, y + 4);
    ctx.lineTo(x + tile - 5, y + 4);
    ctx.lineTo(x + tile - 2, y + tile - 5);
    ctx.closePath();
    ctx.fill();

    const hs = hash(c * 9 + 3, r * 11 + 2);
    if (hs > 0.55) {
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.fillRect(x + 4 + hs * (tile - 10), y + 5 + hs * (tile - 12), 2, 2);
    }

    ctx.strokeStyle = "rgba(0,0,0,.5)";
    ctx.lineWidth = 1;
    roundRect(ctx, x + 2, y + 2, tile - 4, tile - 7, 5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,240,210,.22)";
    ctx.beginPath();
    ctx.moveTo(x + 3, y + tile - 5);
    ctx.lineTo(x + 5, y + 4);
    ctx.lineTo(x + tile - 5, y + 4);
    ctx.stroke();
  }

  const sp = pts[0];
  ctx.strokeStyle = "rgba(255,170,60,.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 11, 0, Math.PI * 2);
  ctx.stroke();
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
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", x, y - r - 9);
  }
  if (e.invisible) {
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

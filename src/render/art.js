function hash(c, r) {
  let h = (c * 73856093) ^ (r * 19349663);
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

export function drawTerrain(ctx, W, H, tile, state) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#16202e");
  g.addColorStop(1, "#0e151f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const tones = ["#1b2a1c", "#1f3020", "#182619", "#202d1e", "#1d2b1d"];
  for (let r = 0; r < state.map.rows; r++) {
    for (let c = 0; c < state.map.cols; c++) {
      const x = c * tile;
      const y = r * tile;
      if (state.blocked.has(`${c},${r}`)) {
        ctx.fillStyle = "#6f5337";
        ctx.fillRect(x, y, tile, tile);
        ctx.fillStyle = "rgba(255,255,255,.06)";
        ctx.fillRect(x, y, tile, 2);
        ctx.fillStyle = "rgba(0,0,0,.18)";
        ctx.fillRect(x, y + tile - 2, tile, 2);
        ctx.fillStyle = "rgba(0,0,0,.12)";
        ctx.fillRect(x, y, 2, tile);
        continue;
      }
      const h1 = hash(c, r);
      const h2 = hash(c * 3 + 1, r * 7 + 5);
      const h3 = hash(r * 11 + 3, c * 5 + 9);
      ctx.fillStyle = tones[Math.floor(h1 * tones.length) % tones.length];
      ctx.fillRect(x, y, tile, tile);
      ctx.fillStyle = "rgba(0,0,0,.10)";
      ctx.fillRect(x, y + tile - 3, tile, 3);
      ctx.fillStyle = "rgba(255,255,255,.035)";
      ctx.fillRect(x, y, tile, 2);

      if (h2 > 0.86) drawGrassTuft(ctx, x, y, tile, h3);
      else if (h2 > 0.72) drawPebble(ctx, x, y, tile, h3);
      else if (h2 > 0.62) drawFlower(ctx, x, y, tile, h3);
      else if (h2 > 0.56) drawPuddle(ctx, x, y, tile, h3);
    }
  }
}

function drawGrassTuft(ctx, x, y, tile, h) {
  const px = x + tile * (0.2 + h * 0.6);
  const py = y + tile * (0.55 + (1 - h) * 0.3);
  ctx.strokeStyle = "rgba(120,180,110,.5)";
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(px + i * 2, py);
    ctx.lineTo(px + i * 2 - 1, py - 4 - (i === 0 ? 2 : 0));
    ctx.stroke();
  }
}

function drawPebble(ctx, x, y, tile, h) {
  const px = x + tile * (0.25 + h * 0.5);
  const py = y + tile * (0.35 + (1 - h) * 0.4);
  ctx.fillStyle = "rgba(150,150,160,.45)";
  ctx.beginPath();
  ctx.ellipse(px, py, 2, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(ctx, x, y, tile, h) {
  const px = x + tile * (0.3 + h * 0.5);
  const py = y + tile * (0.4 + (1 - h) * 0.35);
  const col = h > 0.8 ? "#ffd166" : "#e0aaff";
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(px, py, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.beginPath();
  ctx.arc(px, py, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawPuddle(ctx, x, y, tile, h) {
  const px = x + tile * (0.3 + h * 0.4);
  const py = y + tile * (0.35 + (1 - h) * 0.4);
  ctx.fillStyle = "rgba(70,130,180,.16)";
  ctx.beginPath();
  ctx.ellipse(px, py, tile * 0.22, tile * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(180,220,255,.10)";
  ctx.beginPath();
  ctx.ellipse(px - 2, py - 1, tile * 0.1, tile * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
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
    const cx = x + tile / 2;
    const cy = y + tile / 2;
    const N = isPath(c, r - 1);
    const S = isPath(c, r + 1);
    const E = isPath(c + 1, r);
    const W = isPath(c - 1, r);

    ctx.fillStyle = "#5a4632";
    roundRect(ctx, x + 1.5, y + 1.5, tile - 3, tile - 3, 6);
    ctx.fill();

    ctx.fillStyle = "#6b5238";
    const w = 14;
    if (N) ctx.fillRect(cx - w / 2, y + 1.5, w, tile / 2 - 1.5);
    if (S) ctx.fillRect(cx - w / 2, cy, w, tile / 2 - 1.5);
    if (W) ctx.fillRect(x + 1.5, cy - w / 2, tile / 2 - 1.5, w);
    if (E) ctx.fillRect(cx, cy - w / 2, tile / 2 - 1.5, w);

    ctx.fillStyle = "rgba(255,235,200,.08)";
    roundRect(ctx, x + 4, y + 4, tile - 8, tile - 8, 4);
    ctx.fill();
  }

  const sp = pts[0];
  ctx.strokeStyle = "rgba(120,200,255,.5)";
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
  ctx.fillStyle = "rgba(6,214,160,.12)";
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#10243a";
  ctx.strokeStyle = "#06d6a0";
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

  ctx.fillStyle = "#08121a";
  ctx.fillRect(x - 4, y - 2, 8, 8);

  const wave = Math.sin(time / 12) * 3;
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + 10, y - s - 4 + wave);
  ctx.lineTo(x, y - s + 4);
  ctx.closePath();
  ctx.fill();
}

export function drawTower(ctx, t, time = 0) {
  const x = t.x;
  const y = t.y;
  const lvl = t.level + 1;
  const pulse = 0.5 + 0.5 * Math.sin((time || 0) / 10 + x * 0.02);

  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + 11, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#3a4456";
  roundRect(ctx, -12, 2, 24, 10, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.06)";
  roundRect(ctx, -12, 2, 24, 3, 2);
  ctx.fill();

  switch (t.typeIndex) {
    case 0: drawArco(ctx, lvl, pulse); break;
    case 1: drawCanon(ctx, t.angle, lvl, pulse); break;
    case 2: drawHielo(ctx, lvl, pulse); break;
    case 3: drawFuego(ctx, lvl, pulse); break;
    default: drawArco(ctx, lvl, pulse);
  }
  ctx.restore();

  ctx.fillStyle = "#ffd166";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★".repeat(lvl), x, y + 20);
}

function drawArco(ctx, lvl, pulse) {
  ctx.fillStyle = "#6b4a2b";
  roundRect(ctx, -6, -14 - lvl * 2, 12, 18 + lvl * 2, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.12)";
  roundRect(ctx, -6, -14 - lvl * 2, 4, 18 + lvl * 2, 2);
  ctx.fill();
  ctx.strokeStyle = "#caa472";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -12, 10 + lvl, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = "rgba(230,237,243,.7)";
  ctx.beginPath();
  ctx.moveTo(0, -12 - (10 + lvl));
  ctx.lineTo(0, -12 + (10 + lvl));
  ctx.stroke();
  ctx.fillStyle = "#e6edf3";
  ctx.beginPath();
  ctx.arc(0, -12, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCanon(ctx, angle, lvl, pulse) {
  ctx.fillStyle = "#4a4f57";
  roundRect(ctx, -9, -10 - lvl, 18, 14 + lvl, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.08)";
  roundRect(ctx, -9, -10 - lvl, 18, 3, 2);
  ctx.fill();
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = "#23272e";
  roundRect(ctx, 0, -5, 18 + lvl * 2, 10, 3);
  ctx.fill();
  ctx.fillStyle = "#3a3f47";
  ctx.beginPath();
  ctx.arc(18 + lvl * 2, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHielo(ctx, lvl, pulse) {
  const h = 16 + lvl * 4;
  const g = ctx.createLinearGradient(0, -h, 0, 2);
  g.addColorStop(0, "#bfe9ff");
  g.addColorStop(1, "#5aa9e6");
  ctx.fillStyle = g;
  ctx.strokeStyle = "rgba(220,245,255,.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(8 + lvl, -4);
  ctx.lineTo(0, 4);
  ctx.lineTo(-8 - lvl, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(190,235,255,${0.25 + 0.25 * pulse})`;
  ctx.beginPath();
  ctx.arc(0, -h * 0.55, 3 + lvl * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFuego(ctx, lvl, pulse) {
  ctx.fillStyle = "#5a4636";
  roundRect(ctx, -8, -12 - lvl, 16, 16 + lvl, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.3)";
  roundRect(ctx, -8, -12 - lvl, 16, 4, 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,${Math.floor(140 + 80 * pulse)},40,${0.6 + 0.3 * pulse})`;
  ctx.beginPath();
  ctx.arc(0, -8 - lvl * 0.5, 5 + lvl, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.moveTo(-3, -10 - lvl);
  ctx.lineTo(0, -16 - lvl - (3 + pulse * 3));
  ctx.lineTo(3, -10 - lvl);
  ctx.closePath();
  ctx.fill();
}

export function drawEnemy(ctx, e, time) {
  const bob = Math.sin(time / 8 + e.x * 0.05) * (e.flying ? 2.5 : 1.2);
  const x = e.x;
  const y = e.y + bob;
  const r = e.radius;

  if (e.flying) {
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 6, r, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = e.color;
  ctx.strokeStyle = "rgba(0,0,0,.35)";
  ctx.lineWidth = 2;

  switch (e.type) {
    case "rapido":
      triangle(ctx, r);
      break;
    case "tanque":
      polygon(ctx, r, 6);
      break;
    case "blindado":
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.fillRect(-r + 3, -r + 3, 3, 3);
      ctx.fillRect(r - 6, -r + 3, 3, 3);
      ctx.fillRect(-r + 3, r - 6, 3, 3);
      ctx.fillRect(r - 6, r - 6, 3, 3);
      break;
    case "volador":
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.beginPath();
      ctx.moveTo(-r, 0); ctx.lineTo(0, -r - 4); ctx.lineTo(r, 0);
      ctx.fill();
      break;
    case "divisor":
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.beginPath();
      ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
      ctx.stroke();
      break;
    case "jefe":
      polygon(ctx, r, 8);
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(i * 6, -r);
        ctx.lineTo(i * 6 - 3, -r - 6);
        ctx.lineTo(i * 6 + 3, -r - 6);
      }
      ctx.fill();
      break;
    default:
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  }
  ctx.restore();

  if (e.shield > 0) ring(ctx, x, y, r + 4, "#4cc9f0");
  if (e.elite) {
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", x, y - r - 9);
  }
  if (e.invisible) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#c77dff";
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (e.burnTimer > 0) ring(ctx, x, y, r, "#ff9e00");
  else if (e.slowTimer > 0) ring(ctx, x, y, r, "#a0c4ff");

  const w = r * 2;
  ctx.fillStyle = "#000";
  ctx.fillRect(x - w / 2, y - r - 7, w, 4);
  ctx.fillStyle = e.boss ? "#ff006e" : "#06d6a0";
  ctx.fillRect(x - w / 2, y - r - 7, w * Math.max(0, e.hp / e.maxHp), 4);
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
  ctx.fillStyle = "rgba(255,255,255,.25)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

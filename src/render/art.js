function hash(c, r) {
  let h = (c * 73856093) ^ (r * 19349663);
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

export function drawTerrain(ctx, W, H, tile, state) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#141b26");
  g.addColorStop(1, "#0e131c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (let r = 0; r < state.map.rows; r++) {
    for (let c = 0; c < state.map.cols; c++) {
      const x = c * tile;
      const y = r * tile;
      if (state.blocked.has(`${c},${r}`)) {
        ctx.fillStyle = "#7a5c3e";
        ctx.fillRect(x, y, tile, tile);
        ctx.fillStyle = "rgba(0,0,0,.12)";
        ctx.fillRect(x, y, tile, 3);
        ctx.fillRect(x, y, 3, tile);
        continue;
      }
      const light = (c + r) % 2 === 0;
      ctx.fillStyle = light ? "#1a2230" : "#161d29";
      ctx.fillRect(x, y, tile, tile);
      const h = hash(c, r);
      if (h > 0.82) {
        ctx.fillStyle = "rgba(76,201,240,.06)";
        ctx.beginPath();
        ctx.arc(x + tile * (0.3 + h * 0.4), y + tile * (0.3 + h * 0.4), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function drawPath(ctx, pts) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3c2f22";
  ctx.lineWidth = 32;
  tracePath(ctx, pts);
  ctx.stroke();
  ctx.strokeStyle = "#8a6a45";
  ctx.lineWidth = 24;
  tracePath(ctx, pts);
  ctx.stroke();
  ctx.strokeStyle = "#a9855a";
  ctx.lineWidth = 16;
  tracePath(ctx, pts);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,235,200,.12)";
  ctx.lineWidth = 5;
  tracePath(ctx, pts);
  ctx.stroke();
}

function tracePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
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

export function drawTower(ctx, t) {
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(t.x, t.y + 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0e1622";
  ctx.beginPath();
  ctx.arc(t.x, t.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.color;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.angle);
  ctx.fillStyle = t.color;
  ctx.fillRect(0, -3.5, 16, 7);
  ctx.restore();

  ctx.fillStyle = "#e6edf3";
  ctx.beginPath();
  ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd166";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★".repeat(t.level + 1), t.x, t.y + 20);
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

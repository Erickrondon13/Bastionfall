export class Effects {
  constructor(events) {
    this.particles = [];
    this.shake = 0;
    events.on("enemy:killed", (e) => this.death(e.enemy.x, e.enemy.y, e.enemy.color));
    events.on("enemy:hit", (e) => this.spark(e.x, e.y, e.color));
    events.on("projectile:explode", (e) => this.explosion(e.x, e.y, e.color));
    events.on("base:hit", () => { this.shake = 10; });
    events.on("base:shield", () => { this.shake = 4; });
    events.on("boss:phase", () => { this.shake = 14; });
    events.on("boss:spawn", () => { this.shake = 12; });
    events.on("ability:used", () => { this.shake = 6; });
    events.on("ability:impact", (e) => {
      if (e && e.x != null) this.explosion(e.x, e.y, e.color || "#ffffff");
    });
  }

  spark(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.8 + Math.random() * 1.8;
      this.particles.push({
        kind: "spark", x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.5,
        life: 14 + Math.random() * 8, max: 22, color: color || "#fff", size: 2,
      });
    }
  }

  explosion(x, y, color) {
    this.particles.push({
      kind: "ring", x, y, r0: 4, r1: 34, life: 18, max: 18, color: color || "#ff9e00",
    });
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.4 + Math.random() * 3;
      this.particles.push({
        kind: "spark", x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 22 + Math.random() * 12, max: 34, color: color || "#ff9e00", size: 2.5,
      });
    }
  }

  death(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.8 + Math.random() * 2.2;
      this.particles.push({
        kind: "spark", x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6,
        life: 24 + Math.random() * 14, max: 38, color: color || "#aaa", size: 2.5,
      });
    }
  }

  fireTrail(x, y) {
    this.particles.push({
      kind: "flame", x: x + (Math.random() - 0.5) * 4, y,
      vy: -0.6 - Math.random() * 0.6, life: 12 + Math.random() * 8, max: 20,
      color: "#ff8c1a", size: 2 + Math.random() * 2,
    });
  }

  iceBurst(x, y) {
    this.particles.push({ kind: "ring", x, y, r0: 2, r1: 22, life: 16, max: 16, color: "#a0e9ff" });
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({
        kind: "shard", x, y,
        vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.4,
        life: 18 + Math.random() * 8, max: 26, color: "#cdeaff", size: 3,
      });
    }
  }

  update(state) {
    if (state && state.enemigos && this.particles.length < 320) {
      for (const e of state.enemigos) {
        if (e.burnTimer > 0 && Math.random() < 0.3) this.fireTrail(e.x, e.y - e.radius * 0.5);
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.kind === "ring") {
        p.life--;
      } else {
        p.x += p.vx || 0;
        p.y += (p.vy || 0);
        if (p.kind !== "flame") p.vy += 0.05;
        p.life--;
      }
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    if (this.shake > 0) {
      this.shake *= 0.85;
      if (this.shake < 0.5) this.shake = 0;
    }
  }

  shakeOffset() {
    if (this.shake <= 0) return { x: 0, y: 0 };
    return { x: (Math.random() - 0.5) * this.shake, y: (Math.random() - 0.5) * this.shake };
  }

  draw(ctx) {
    for (const p of this.particles) {
      const t = Math.max(0, p.life / p.max);
      ctx.globalAlpha = t;
      if (p.kind === "ring") {
        const r = p.r0 + (p.r1 - p.r0) * (1 - t);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "shard") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size, p.y + p.size);
        ctx.lineTo(p.x - p.size, p.y + p.size);
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === "flame") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }
}

export class Effects {
  constructor(events) {
    this.particles = [];
    this.shake = 0;
    events.on("enemy:killed", (e) => this.burst(e.enemy.x, e.enemy.y, e.enemy.color, 8));
    events.on("base:hit", () => { this.shake = 10; });
    events.on("boss:phase", () => { this.shake = 14; });
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 2.5;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 20 + Math.random() * 15,
        max: 35,
        color,
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;
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
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}

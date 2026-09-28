export class Camera {
  constructor(config) {
    this.config = config || { cameraMode: "topdown", tiltY: 0.62, margin: 0.94 };
    this.m = [1, 0, 0, 1, 0, 0];
    this.worldW = 760;
    this.worldH = 520;
    this.canvasW = 760;
    this.canvasH = 520;
    this.scale = 1;
  }

  update(worldW, worldH, canvasW, canvasH) {
    this.worldW = worldW;
    this.worldH = worldH;
    this.canvasW = canvasW;
    this.canvasH = canvasH;

    if (this.config.cameraMode === "isometric") {
      const tiltY = this.config.tiltY ?? 0.62;
      const margin = this.config.margin ?? 0.94;
      const s = Math.min(canvasW / worldW, canvasH / worldH / tiltY) * margin;
      const e = (canvasW - worldW * s) / 2;
      const f = (canvasH - worldH * s * tiltY) / 2;
      this.m = [s, 0, 0, s * tiltY, e, f];
      this.scale = s;
    } else {
      this.m = [1, 0, 0, 1, 0, 0];
      this.scale = 1;
    }
  }

  apply(ctx) {
    ctx.setTransform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
  }

  worldToScreen(x, y) {
    const [a, b, c, d, e, f] = this.m;
    return [a * x + c * y + e, b * x + d * y + f];
  }

  screenToWorld(x, y) {
    const [a, b, c, d, e, f] = this.m;
    const det = a * d - b * c || 1;
    const dx = x - e;
    const dy = y - f;
    return [(d * dx - c * dy) / det, (-b * dx + a * dy) / det];
  }
}

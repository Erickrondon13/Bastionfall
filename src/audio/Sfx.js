export class Sfx {
  constructor(events, options = {}) {
    this.events = events;
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.muted = !!options.muted;
    this.onMuteChange = options.onMuteChange || null;
    this.bind();
    const wake = () => this.ensure();
    window.addEventListener("pointerdown", wake, { once: true });
    window.addEventListener("keydown", wake, { once: true });
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.value = m ? 0 : 0.18;
    }
    if (this.onMuteChange) this.onMuteChange(m);
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    } catch {
      this.enabled = false;
    }
  }

  bind() {
    this.events.on("enemy:killed", () => this.blip(440, 0.05, "square", 0.05));
    this.events.on("wave:complete", () => this.arpeggio([523, 659], 0.08));
    this.events.on("base:hit", () => this.blip(150, 0.14, "sawtooth", 0.08));
    this.events.on("boss:spawn", () => this.arpeggio([196, 146, 110], 0.18));
    this.events.on("boss:phase", () => this.arpeggio([330, 440, 550], 0.1));
    this.events.on("game:victory", () => this.arpeggio([523, 659, 784, 1046], 0.12));
    this.events.on("game:over", () => this.arpeggio([330, 247, 196], 0.16));
  }

  blip(freq, dur, type = "sine", gain = 0.06) {
    if (!this.enabled || this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur);
  }

  arpeggio(notes, step) {
    if (!this.enabled || this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    notes.forEach((f, i) => {
      setTimeout(() => this.blip(f, step * 1.4, "triangle", 0.06), i * step * 1000);
    });
  }
}

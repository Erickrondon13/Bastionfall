const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function padTrack(tempo, chords) {
  return { tempo, pad: true, steps: chords.map((c) => ({ notes: c.notes.map(mtof), bass: mtof(c.bass) })) };
}

function arpTrack(tempo, chords, order) {
  const steps = [];
  for (const idx of order) {
    const ch = chords[idx];
    for (let k = 0; k < ch.notes.length; k++) {
      steps.push({ notes: [mtof(ch.notes[k])], bass: mtof(ch.bass) });
    }
  }
  return { tempo, steps };
}

const TRACKS = {
  menu: padTrack(52, [
    { notes: [60, 64, 67, 71], bass: 48 },
    { notes: [57, 60, 64, 67], bass: 45 },
    { notes: [53, 57, 60, 64], bass: 41 },
    { notes: [55, 59, 62, 66], bass: 43 },
  ]),
  gameplay: arpTrack(
    126,
    [
      { notes: [57, 60, 64, 69], bass: 45 },
      { notes: [53, 57, 60, 65], bass: 41 },
      { notes: [48, 52, 55, 60], bass: 48 },
      { notes: [55, 59, 62, 67], bass: 43 },
    ],
    [0, 0, 1, 1, 2, 2, 3, 3]
  ),
  boss: arpTrack(
    150,
    [
      { notes: [50, 53, 57], bass: 38 },
      { notes: [46, 50, 53], bass: 46 },
      { notes: [43, 46, 50], bass: 43 },
      { notes: [45, 49, 52], bass: 45 },
    ],
    [0, 0, 1, 1, 2, 2, 3, 3]
  ),
  victory: arpTrack(
    112,
    [
      { notes: [60, 64, 67, 72], bass: 48 },
      { notes: [67, 72, 76, 79], bass: 55 },
      { notes: [65, 69, 72, 77], bass: 53 },
      { notes: [60, 64, 67, 72], bass: 48 },
    ],
    [0, 0, 1, 1, 2, 2, 3, 3]
  ),
  defeat: padTrack(46, [
    { notes: [57, 60, 64], bass: 45 },
    { notes: [53, 57, 60], bass: 41 },
    { notes: [50, 53, 57], bass: 38 },
    { notes: [55, 59, 62], bass: 43 },
  ]),
};

export class Music {
  constructor(sfx, options = {}) {
    this.sfx = sfx;
    this.track = null;
    this.timer = null;
    this.nextNoteTime = 0;
    this.step = 0;
    this.volume = options.volume ?? 0.05;
    this.onTrackChange = options.onTrackChange || null;
  }

  get ctx() {
    return this.sfx.ctx;
  }

  get out() {
    return this.sfx.master;
  }

  get muted() {
    return this.sfx.muted || !this.sfx.enabled;
  }

  setTrack(name) {
    if (!TRACKS[name]) return;
    if (this.track === name) return;
    this.track = name;
    this.step = 0;
    if (this.onTrackChange) this.onTrackChange(name);
    this.ensureRunning();
  }

  ensureRunning() {
    this.sfx.ensure();
    if (!this.ctx || this.timer) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.scheduler(), 60);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.track = null;
  }

  scheduler() {
    if (!this.ctx) {
      this.sfx.ensure();
      if (!this.ctx) return;
    }
    if (this.muted) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      return;
    }
    const def = TRACKS[this.track];
    if (!def) return;
    const stepDur = 60 / def.tempo / 2;
    const lookahead = 0.2;
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.scheduleStep(this.nextNoteTime, stepDur);
      this.nextNoteTime += stepDur;
      this.step++;
    }
  }

  scheduleStep(time, stepDur) {
    const def = TRACKS[this.track];
    const s = this.step % def.steps.length;
    const ev = def.steps[s];
    const dur = stepDur * (def.pad ? 1.9 : 0.95);
    if (ev.bass != null) this.tone(ev.bass, time, dur * 0.9, "triangle", this.volume * 1.3);
    if (ev.notes) for (const f of ev.notes) this.tone(f, time, dur, def.pad ? "sine" : "sawtooth", this.volume);
  }

  tone(freq, time, dur, type, gain) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 2000;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(gain, time + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.out);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }
}

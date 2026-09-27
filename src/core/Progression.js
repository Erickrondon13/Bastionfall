import { TECH_NODES, SAVE_KEY, defaultSave } from "../config/progression.js";
import { CAMPAIGN } from "../config/campaign.js";
import { withRetry, withTimeoutSync, TimeoutError } from "./resilience.js";

export class Progression {
  constructor(storage) {
    this.storage = storage || (typeof localStorage !== "undefined" ? localStorage : memoryStorage());
    this.data = this.load();
  }

  load() {
    try {
      const raw = withRetry(
        () => withTimeoutSync(() => this.storage.getItem(SAVE_KEY), 30, "load"),
        { retries: 2, label: "load" }
      );
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return {
        esencia: parsed.esencia || 0,
        nodes: parsed.nodes || {},
        stars: parsed.stars || {},
        campaign: parsed.campaign || {},
      };
    } catch {
      return defaultSave();
    }
  }

  save() {
    try {
      const payload = JSON.stringify(this.data);
      withRetry(
        () => withTimeoutSync(() => this.storage.setItem(SAVE_KEY, payload), 50, "save"),
        { retries: 3, baseDelay: 10, label: "save" }
      );
    } catch (e) {
      if (e instanceof TimeoutError) console.warn("Progression.save: timeout en escritura");
    }
  }

  has(nodeId) {
    return !!this.data.nodes[nodeId];
  }

  esencia() {
    return this.data.esencia;
  }

  purchase(nodeId) {
    const node = TECH_NODES.find(n => n.id === nodeId);
    if (!node || this.has(nodeId)) return false;
    if (this.data.esencia < node.cost) return false;
    this.data.esencia -= node.cost;
    this.data.nodes[nodeId] = true;
    this.save();
    return true;
  }

  award(oleada, victory) {
    const gain = oleada * 5 + (victory ? 50 : 0);
    this.data.esencia += gain;
    this.save();
    return gain;
  }

  recordStars(mapId, stars) {
    this.data.stars = this.data.stars || {};
    const prev = this.data.stars[mapId] || 0;
    if (stars > prev) {
      this.data.stars[mapId] = stars;
      this.save();
    }
    return this.bestStars(mapId);
  }

  bestStars(mapId) {
    return (this.data.stars && this.data.stars[mapId]) || 0;
  }

  recordStage(stageId, stars) {
    this.data.campaign = this.data.campaign || {};
    this.data.campaign[stageId] = true;
    const prev = (this.data.stars && this.data.stars[stageId]) || 0;
    if (stars > prev) {
      this.data.stars = this.data.stars || {};
      this.data.stars[stageId] = stars;
    }
    this.save();
    return stars;
  }

  isStageUnlocked(index) {
    if (index <= 0) return true;
    const prev = CAMPAIGN[index - 1];
    return !!(this.data.campaign && this.data.campaign[prev.id]);
  }

  isStageCompleted(stageId) {
    return !!(this.data.campaign && this.data.campaign[stageId]);
  }

  // --- Derivar modificadores para una partida ---
  mods() {
    const dmg = { arco: 1, cañon: 1, hielo: 1, fuego: 1 };
    let range = 1;
    for (const node of TECH_NODES) {
      if (!this.has(node.id)) continue;
      if (node.kind === "stat") {
        if (node.stat.startsWith("dmg_")) dmg[node.stat.slice(4)] += node.value;
        else if (node.stat === "range_all") range += node.value;
      }
    }
    return { dmg, range };
  }

  startBonus() {
    let gold = 0;
    let life = 0;
    for (const node of TECH_NODES) {
      if (this.has(node.id) && node.kind === "stat") {
        if (node.stat === "startGold") gold += node.value;
        if (node.stat === "startLife") life += node.value;
      }
    }
    return { gold, life };
  }

  isTowerUnlocked(key) {
    if (key === "fuego") return this.has("unlock_fuego");
    return true;
  }
}

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

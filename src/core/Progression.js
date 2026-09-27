import { TECH_NODES, SAVE_KEY, defaultSave } from "../config/progression.js";

export class Progression {
  constructor(storage) {
    this.storage = storage || (typeof localStorage !== "undefined" ? localStorage : memoryStorage());
    this.data = this.load();
  }

  load() {
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return { esencia: parsed.esencia || 0, nodes: parsed.nodes || {} };
    } catch {
      return defaultSave();
    }
  }

  save() {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      /* almacenamiento no disponible */
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

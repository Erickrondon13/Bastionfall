import { SYNERGIES, blankMods } from "../config/synergies.js";

export class SynergySystem {
  update(state) {
    const present = new Set(state.torres.map((t) => t.key));
    const mods = blankMods();
    const active = [];
    for (const s of SYNERGIES) {
      if (s.requires.every((k) => present.has(k))) {
        s.apply(mods);
        active.push(s.name);
      }
    }
    state.synergyMods = mods;
    state.activeSynergies = active;
  }
}

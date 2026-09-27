export class AbilitySystem {
  update(state) {
    for (const id in state.abilityCd) {
      if (state.abilityCd[id] > 0) state.abilityCd[id]--;
    }
    if (state.baseShield > 0) state.baseShield--;
  }
}

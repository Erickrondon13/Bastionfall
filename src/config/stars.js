export function computeStars(state) {
  if (!state.victory) return 0;
  let stars = 1;
  const vidaMax = state.vidaMax || state.vida || 1;
  const lifeRatio = state.vida / vidaMax;
  if (lifeRatio >= 0.5) stars++;

  const goldRatio = state.oro / (state.map.startGold + 1);
  const timeSec = (state.time || 0) / 60;
  const fast = timeSec <= 180;
  if (goldRatio >= 0.5 || fast) stars++;

  return Math.min(3, stars);
}

export function starsToString(n) {
  n = Math.max(0, Math.min(3, n | 0));
  return "★".repeat(n) + "☆".repeat(3 - n);
}

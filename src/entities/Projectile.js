export function createProjectile(tower, target, syn) {
  syn = syn || {};
  const dmgMult = syn.dmgMult || 1;
  const splashMult = syn.splashMult || 1;
  const slowMult = syn.slowMult || 1;
  const critAdd = syn.critAdd || 0;
  return {
    x: tower.x,
    y: tower.y,
    target,
    speed: tower.projSpeed,
    damage: tower.damage * dmgMult,
    splash: tower.splash * splashMult,
    slow: tower.slow,
    slowDur: (tower.slow > 0 ? 90 : 0) * slowMult,
    burn: tower.burn,
    burnTime: tower.burnTime,
    crit: Math.min(1, (tower.crit || 0) + critAdd),
    color: tower.proj,
    dead: false,
  };
}

export function createProjectile(tower, target) {
  return {
    x: tower.x,
    y: tower.y,
    target,
    speed: tower.projSpeed,
    damage: tower.damage,
    splash: tower.splash,
    slow: tower.slow,
    burn: tower.burn,
    burnTime: tower.burnTime,
    crit: tower.crit || 0,
    color: tower.proj,
    dead: false,
  };
}

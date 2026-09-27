import { TOWER_TYPES, towerStats } from "../config/towers.js";

export function createTower(typeIndex, c, r, tile, mods) {
  const type = TOWER_TYPES[typeIndex];
  const stats = towerStats(typeIndex, 0);
  mods = mods || { dmg: { arco: 1, cañon: 1, hielo: 1, fuego: 1 }, range: 1 };
  const dmgMult = mods.dmg[type.key] || 1;
  return {
    typeIndex,
    key: type.key,
    name: type.name,
    color: type.color,
    proj: type.proj,
    targeting: type.targeting,
    c,
    r,
    x: c * tile + tile / 2,
    y: r * tile + tile / 2,
    level: 0,
    range: Math.round(stats.range * mods.range),
    damage: Math.round(stats.damage * dmgMult),
    cooldown: stats.cooldown,
    splash: stats.splash,
    slow: stats.slow,
    projSpeed: stats.projSpeed,
    burn: stats.burn || 0,
    burnTime: stats.burnTime || 0,
    cool: 0,
    invested: stats.cost,
    angle: -Math.PI / 2,
  };
}

export function towerUpgradeCost(tower) {
  const type = TOWER_TYPES[tower.typeIndex];
  const next = type.levels[tower.level + 1];
  return next ? next.cost : null;
}

export function upgradeTower(tower, mods) {
  const type = TOWER_TYPES[tower.typeIndex];
  const next = type.levels[tower.level + 1];
  if (!next) return false;
  mods = mods || { dmg: { arco: 1, cañon: 1, hielo: 1, fuego: 1 }, range: 1 };
  const dmgMult = mods.dmg[tower.key] || 1;
  tower.level++;
  tower.range = Math.round(next.range * mods.range);
  tower.damage = Math.round(next.damage * dmgMult);
  tower.cooldown = next.cooldown;
  tower.splash = next.splash;
  tower.slow = next.slow;
  tower.projSpeed = next.projSpeed;
  tower.burn = next.burn || 0;
  tower.burnTime = next.burnTime || 0;
  tower.invested += next.cost;
  return true;
}

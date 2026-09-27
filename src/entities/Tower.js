import { TOWER_TYPES, towerStats } from "../config/towers.js";

export function createTower(typeIndex, c, r, tile) {
  const type = TOWER_TYPES[typeIndex];
  const stats = towerStats(typeIndex, 0);
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
    range: stats.range,
    damage: stats.damage,
    cooldown: stats.cooldown,
    splash: stats.splash,
    slow: stats.slow,
    projSpeed: stats.projSpeed,
    burn: stats.burn || 0,
    burnTime: stats.burnTime || 0,
    cool: 0,
    invested: stats.cost,
  };
}

export function towerUpgradeCost(tower) {
  const type = TOWER_TYPES[tower.typeIndex];
  const next = type.levels[tower.level + 1];
  return next ? next.cost : null;
}

export function upgradeTower(tower) {
  const type = TOWER_TYPES[tower.typeIndex];
  const next = type.levels[tower.level + 1];
  if (!next) return false;
  tower.level++;
  tower.range = next.range;
  tower.damage = next.damage;
  tower.cooldown = next.cooldown;
  tower.splash = next.splash;
  tower.slow = next.slow;
  tower.projSpeed = next.projSpeed;
  tower.burn = next.burn || 0;
  tower.burnTime = next.burnTime || 0;
  tower.invested += next.cost;
  return true;
}

import { TOWER_TYPES, towerStats } from "../config/towers.js";

function applyStats(tower, next, mods) {
  const dmgMult = mods.dmg[tower.key] || 1;
  tower.range = Math.round(next.range * mods.range * (mods.zoneRange || 1));
  tower.damage = Math.round(next.damage * dmgMult);
  tower.cooldown = Math.round(next.cooldown * (mods.cdMult || 1));
  tower.cooldownMax = Math.round(next.cooldown * (mods.cdMult || 1));
  tower.splash = next.splash;
  tower.slow = next.slow;
  tower.crit = next.crit || 0;
  tower.projSpeed = next.projSpeed;
  tower.burn = next.burn || 0;
  tower.burnTime = next.burnTime || 0;
  tower.invested += next.cost;
}

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
    branch: null,
    branchName: "",
    c,
    r,
    x: c * tile + tile / 2,
    y: r * tile + tile / 2,
    level: 0,
    range: Math.round(stats.range * mods.range * (mods.zoneRange || 1)),
    damage: Math.round(stats.damage * dmgMult),
    cooldown: Math.round(stats.cooldown * (mods.cdMult || 1)),
    cooldownMax: Math.round(stats.cooldown * (mods.cdMult || 1)),
    splash: stats.splash,
    slow: stats.slow,
    crit: stats.crit || 0,
    projSpeed: stats.projSpeed,
    burn: stats.burn || 0,
    burnTime: stats.burnTime || 0,
    cool: 0,
    invested: stats.cost,
    disabledTimer: 0,
    angle: -Math.PI / 2,
  };
}

export function towerUpgradeCost(tower) {
  const type = TOWER_TYPES[tower.typeIndex];
  if (tower.branch == null) return tower.level === 0 ? type.levels[1].cost : null;
  const idx = tower.level - 1;
  const next = type.branches[tower.branch] && type.branches[tower.branch].levels[idx];
  return next ? next.cost : null;
}

export function upgradeTower(tower, mods) {
  const type = TOWER_TYPES[tower.typeIndex];
  mods = mods || { dmg: { arco: 1, cañon: 1, hielo: 1, fuego: 1 }, range: 1 };
  if (tower.branch == null) {
    if (tower.level === 0) {
      applyStats(tower, type.levels[1], mods);
      tower.level = 1;
      return true;
    }
    return false; // debe elegir rama primero
  }
  if (tower.level >= 3) return false;
  const bi = tower.level - 1;
  const next = type.branches[tower.branch].levels[bi];
  if (!next) return false;
  applyStats(tower, next, mods);
  tower.level++;
  return true;
}

export function chooseBranch(tower, which, mods) {
  const type = TOWER_TYPES[tower.typeIndex];
  if (tower.branch != null || tower.level !== 1) return false;
  const b = type.branches[which];
  if (!b) return false;
  mods = mods || { dmg: { arco: 1, cañon: 1, hielo: 1, fuego: 1 }, range: 1 };
  applyStats(tower, b.levels[0], mods);
  tower.branch = which;
  tower.branchName = b.name;
  tower.level = 2;
  return true;
}

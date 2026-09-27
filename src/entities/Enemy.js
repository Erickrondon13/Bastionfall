import { ENEMY_TYPES, MAX_HP_SCALE } from "../config/enemies.js";

export function createEnemy(typeKey, wave, start) {
  const t = ENEMY_TYPES[typeKey];
  const hpScale = 1 + (wave - 1) * MAX_HP_SCALE;
  const hp = Math.round(t.hp * (t.boss ? 1 + (wave - 1) * 0.4 : hpScale));
  return {
    type: typeKey,
    name: t.name,
    x: start.x,
    y: start.y,
    hp,
    maxHp: hp,
    speed: t.speed,
    baseSpeed: t.speed,
    reward: t.reward,
    color: t.color,
    radius: t.radius,
    armor: t.armor,
    flying: t.flying,
    onDeath: t.onDeath,
    boss: !!t.boss,
    pathIndex: 0,
    slowTimer: 0,
    burnTimer: 0,
    burnDamage: 0,
  };
}

export function createSplitEnemy(parent, hp) {
  return {
    type: "basico",
    name: "Cachorro",
    x: parent.x,
    y: parent.y,
    hp,
    maxHp: hp,
    speed: parent.baseSpeed * 1.4,
    baseSpeed: parent.baseSpeed * 1.4,
    reward: 4,
    color: "#ffb3de",
    radius: 7,
    armor: 0,
    flying: false,
    onDeath: null,
    boss: false,
    pathIndex: parent.pathIndex,
    slowTimer: 0,
    burnTimer: 0,
    burnDamage: 0,
  };
}

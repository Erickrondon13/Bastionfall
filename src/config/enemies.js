import { BALANCE } from "./balance.js";

export const ENEMY_TYPES = {
  basico: {
    key: "basico",
    name: "Básico",
    hp: 40,
    speed: 1.1,
    reward: 12,
    color: "#ffd166",
    radius: 11,
    armor: 0,
    flying: false,
    onDeath: null,
  },
  rapido: {
    key: "rapido",
    name: "Rápido",
    hp: 22,
    speed: 2.1,
    reward: 14,
    color: "#06d6a0",
    radius: 9,
    armor: 0,
    flying: false,
    onDeath: null,
  },
  tanque: {
    key: "tanque",
    name: "Tanque",
    hp: 140,
    speed: 0.6,
    reward: 30,
    color: "#b5179e",
    radius: 15,
    armor: 0.15,
    flying: false,
    onDeath: null,
  },
  volador: {
    key: "volador",
    name: "Volador",
    hp: 55,
    speed: 1.5,
    reward: 18,
    color: "#90e0ef",
    radius: 10,
    armor: 0,
    flying: true,
    onDeath: null,
  },
  blindado: {
    key: "blindado",
    name: "Blindado",
    hp: 90,
    speed: 0.9,
    reward: 24,
    color: "#8d99ae",
    radius: 13,
    armor: 0.45,
    flying: false,
    onDeath: null,
  },
  divisor: {
    key: "divisor",
    name: "Divisor",
    hp: 70,
    speed: 1.0,
    reward: 16,
    color: "#f15bb5",
    radius: 13,
    armor: 0,
    flying: false,
    onDeath: "split",
  },
  regenerativo: {
    key: "regenerativo",
    name: "Regenerativo",
    hp: 60,
    speed: 0.9,
    reward: 18,
    color: "#80ed99",
    radius: 11,
    armor: 0,
    flying: false,
    onDeath: null,
    regen: 7,
  },
  invisible: {
    key: "invisible",
    name: "Invisible",
    hp: 42,
    speed: 1.4,
    reward: 22,
    color: "#c77dff",
    radius: 10,
    armor: 0,
    flying: false,
    onDeath: null,
    invisible: true,
  },
  curador: {
    key: "curador",
    name: "Curador",
    hp: 95,
    speed: 0.7,
    reward: 26,
    color: "#48cae4",
    radius: 13,
    armor: 0,
    flying: false,
    onDeath: null,
    healRadius: 95,
    healRate: 10,
  },
  invocador: {
    key: "invocador",
    name: "Invocador",
    hp: 115,
    speed: 0.7,
    reward: 30,
    color: "#f72585",
    radius: 14,
    armor: 0.1,
    flying: false,
    onDeath: null,
    summonEvery: 150,
  },
  jefe: {
    key: "jefe",
    name: "Jefe",
    hp: 1200,
    speed: 0.45,
    reward: 250,
    color: "#ff006e",
    radius: 22,
    armor: 0.3,
    flying: false,
    onDeath: null,
    boss: true,
  },
};

export const ELITE_AFFIXES = {
  resistente: {
    name: "Resistente al hielo",
    apply: (e) => { e.slowResist = true; },
  },
  rapido: {
    name: "Rápido",
    apply: (e) => { e.baseSpeed *= 1.3; e.speed = e.baseSpeed; },
  },
  escudo: {
    name: "Escudo",
    apply: (e) => { e.shield = Math.round(e.maxHp * 0.5); },
  },
  brutal: {
    name: "Brutal",
    apply: (e) => { e.maxHp = Math.round(e.maxHp * 1.5); e.hp = e.maxHp; e.reward = Math.round(e.reward * 1.5); e.elite = true; },
  },
};

export function applyElite(e, rng = Math.random, count = 1) {
  const keys = Object.keys(ELITE_AFFIXES);
  const chosen = [];
  for (let i = 0; i < count && keys.length; i++) {
    const idx = Math.floor(rng() * keys.length);
    const k = keys.splice(idx, 1)[0];
    ELITE_AFFIXES[k].apply(e);
    chosen.push(ELITE_AFFIXES[k].name);
  }
  e.affixNames = chosen;
  return e;
}

export const MAX_HP_SCALE = BALANCE.enemyHpScalePerWave;

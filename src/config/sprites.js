// Manifest de sprites (pack Kenney "Tower Defense", licencia CC0).
// Cada entidad puede apuntar a un PNG en assets/sprites/. Si no hay sprite
// (o no cargó), el render cae al arte programático. Para cambiar el aspecto
// de una torre/enemigo solo edita los nombres de archivo aquí.

export const spriteManifest = {
  enabled: true,
  // Torre por typeIndex (0 arco, 1 cañón, 2 hielo, 3 fuego) y nivel (0..2).
  // Usamos 3 juegos de color del pack para distinguir las torres.
  towers: {
    0: ["towers/grey/tower_00.png", "towers/grey/tower_09.png", "towers/grey/tower_18.png"],
    1: ["towers/red/tower_00.png", "towers/red/tower_09.png", "towers/red/tower_18.png"],
    2: ["towers/brown/tower_00.png", "towers/brown/tower_09.png", "towers/brown/tower_18.png"],
    3: ["towers/grey/tower_27.png", "towers/grey/tower_36.png", "towers/grey/tower_45.png"],
  },
  // Decoraciones del mapa por tipo (1 pino, 2 otoño, 3 arbusto, 4 roca).
  decorations: {
    1: ["details/trees_1.png", "details/trees_2.png", "details/trees_3.png"],
    2: ["details/trees_5.png", "details/trees_6.png", "details/trees_7.png"],
    3: ["details/trees_9.png", "details/trees_10.png", "details/trees_11.png"],
    4: ["details/rocks_1.png", "details/rocks_3.png", "details/rocks_5.png"],
  },
  crystals: ["details/crystals_1.png", "details/crystals_2.png", "details/crystals_3.png", "details/crystals_4.png"],
  base: null, // sin sprite de base: usa arte programático
  // Enemigos: una celda recortada del spritesheet "Roguelike Characters" (Kenney).
  // Si un índice no te gusta, cámbialo por otro de assets/sprites/enemies/char_XXX.png.
  enemies: {
    basico: "enemies/char_270.png",
    rapido: "enemies/char_300.png",
    tanque: "enemies/char_330.png",
    blindado: "enemies/char_360.png",
    volador: "enemies/char_390.png",
    divisor: "enemies/char_420.png",
    jefe: "enemies/char_595.png",
    // Variante élite: misma base pero se marca con estrella.
  },
  // Suelo: elige un tile del pack "Tower Defense (Top-Down)" para hierba y del
  // "Tiny Dungeon" para las cavernas. Cambia el número si prefieres otro tile.
  terrain: {
    grass: "terrain/towerDefense_tile040.png",
    cave: "cave/tile_0061.png",
  },
  star: "ui/star.png",
};

function keyToFile(file) {
  return "assets/sprites/" + file;
}

// Construye el mapa plano de carga (clave -> ruta) para el SpriteManager.
export function buildSpriteEntries() {
  const entries = {};
  const add = (file) => { if (file) entries[file] = keyToFile(file); };
  for (const arr of Object.values(spriteManifest.towers)) arr.forEach(add);
  for (const arr of Object.values(spriteManifest.decorations)) arr.forEach(add);
  spriteManifest.crystals.forEach(add);
  Object.values(spriteManifest.enemies).forEach(add);
  Object.values(spriteManifest.terrain).forEach(add);
  if (spriteManifest.star) add(spriteManifest.star);
  return entries;
}

export function towerSpriteKey(typeIndex, level) {
  const arr = spriteManifest.towers[typeIndex];
  if (!arr || !spriteManifest.enabled) return null;
  const lvl = Math.max(0, Math.min(arr.length - 1, level || 0));
  return arr[lvl] || null;
}

export function decoSpriteKey(type, variant = 0) {
  const arr = spriteManifest.decorations[type];
  if (!arr || !spriteManifest.enabled) return null;
  const v = ((variant % arr.length) + arr.length) % arr.length;
  return arr[v] || null;
}

export function crystalSpriteKey(variant = 0) {
  const arr = spriteManifest.crystals;
  const v = ((variant % arr.length) + arr.length) % arr.length;
  return arr[v] || null;
}

export function enemySpriteKey(type) {
  if (!spriteManifest.enabled) return null;
  return spriteManifest.enemies[type] || spriteManifest.enemies.basico || null;
}

export function terrainKey(state) {
  if (!spriteManifest.enabled) return null;
  const cave = state && (state.map && state.map.cave);
  return cave ? spriteManifest.terrain.cave : spriteManifest.terrain.grass;
}

export function starSpriteKey() {
  return spriteManifest.enabled ? spriteManifest.star : null;
}

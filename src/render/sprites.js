import { buildSpriteEntries } from "../config/sprites.js";

// Carga imágenes PNG de forma perezosa y las expone por clave (ruta relativa
// sin el prefijo assets/sprites/). Si una imagen falla, simplemente no está
// disponible y el render usa el arte programático.
class SpriteManager {
  constructor() {
    this.images = new Map();
    this.loading = false;
    this.loaded = false;
    this.ready = null;
  }

  load() {
    if (this.loaded || this.loading) return this.ready || Promise.resolve();
    this.loading = true;
    const entries = buildSpriteEntries();
    const tasks = Object.values(entries).map(
      (path) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.images.set(path, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = path;
        })
    );
    this.ready = Promise.all(tasks).then(() => {
      this.loaded = true;
      this.loading = false;
    });
    return this.ready;
  }

  get(file) {
    if (!file) return null;
    return this.images.get("assets/sprites/" + file) || null;
  }

  has(file) {
    return !!this.get(file);
  }
}

export const sprites = new SpriteManager();

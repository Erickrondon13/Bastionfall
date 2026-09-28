import * as THREE from "../../vendor/three.module.js";
import { THEMES, ZONE_TYPES } from "../config/maps.js";
import { TOWER_TYPES, towerStats } from "../config/towers.js";
import { drawEnemy } from "./art.js";
import { sprites } from "./sprites.js";

const lerp = (a, b, t) => a + (b - a) * t;

export class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.tile = 40;
    this._mapId = null;
    this._seed = 1;
    this._towers = new Map();
    this._enemies = new Map();
    this._projectiles = new Map();

    this._enemyTexCache = new Map();
    this._enemyTexVersion = 0;
    sprites.load().then(() => { this._enemyTexVersion++; });

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(1);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 1, 8000);

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._ndc = new THREE.Vector2();

    this.target = new THREE.Vector3(0, 0, 0);
    this.theta = 0;
    this.phi = 0.82;
    this.dist = 1000;

    this._initLights();
    this._initOverlay();
    this._bindControls();
  }

  _initLights() {
    this.hemi = new THREE.HemisphereLight(0xbfd4ff, 0x223018, 0.9);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffe7b0, 1.0);
    this.sun.position.set(400, 900, 300);
    this.scene.add(this.sun);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(this.ambient);
  }

  _makeGradientTexture(top, bottom) {
    const c = document.createElement("canvas");
    c.width = 2; c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#" + top.getHexString());
    g.addColorStop(1, "#" + bottom.getHexString());
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    if ("SRGBColorSpace" in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  _initOverlay() {
    this.hoverTile = new THREE.Mesh(
      new THREE.BoxGeometry(this.tile * 0.92, 6, this.tile * 0.92),
      new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.28 })
    );
    this.hoverTile.visible = false;
    this.scene.add(this.hoverTile);

    this.rangeRing = new THREE.Mesh(
      new THREE.RingGeometry(1, 1, 56),
      new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    this.rangeRing.rotation.x = -Math.PI / 2;
    this.rangeRing.visible = false;
    this.scene.add(this.rangeRing);
  }

  _bindControls() {
    const c = this.canvas;
    let dragging = null;
    let lastX = 0, lastY = 0;

    c.addEventListener("contextmenu", (e) => e.preventDefault());

    c.addEventListener("pointerdown", (e) => {
      if (e.button === 2) dragging = "orbit";
      else if (e.button === 1) dragging = "pan";
      else return;
      lastX = e.clientX; lastY = e.clientY;
      c.setPointerCapture(e.pointerId);
    });

    c.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (dragging === "orbit") {
        this.theta -= dx * 0.006;
        this.phi = Math.max(0.15, Math.min(1.35, this.phi - dy * 0.006));
      } else if (dragging === "pan") {
        const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
        const k = this.dist * 0.0014;
        this.target.addScaledVector(right, -dx * k);
        this.target.addScaledVector(up, dy * k);
      }
    });

    const end = (e) => { dragging = null; };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);

    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.dist = Math.max(320, Math.min(2600, this.dist * (1 + Math.sign(e.deltaY) * 0.1)));
    }, { passive: false });
  }

  _hash(i, j) {
    const n = Math.sin(i * 127.1 + j * 311.7 + this._seed) * 43758.5453;
    return n - Math.floor(n);
  }

  _vnoise(x, z) {
    const xi = Math.floor(x), zi = Math.floor(z);
    const xf = x - xi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = this._hash(xi, zi), b = this._hash(xi + 1, zi);
    const cc = this._hash(xi, zi + 1), d = this._hash(xi + 1, zi + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + cc * (1 - u) * v + d * u * v;
  }

  _heightAtWorld(x, z) {
    const f = 0.018;
    let n = this._vnoise(x * f, z * f) * 0.65 + this._vnoise(x * f * 2.7 + 9, z * f * 2.7 + 9) * 0.35;
    let h = (n - 0.5) * 16 - 1;
    const c = Math.floor(x / this.tile), r = Math.floor(z / this.tile);
    if (this._blocked && this._blocked.has(c + "," + r)) h += 5;
    return h;
  }

  _ensureMap(state) {
    if (this._mapId === state.map.id && this._sceneBuilt) return;
    this._mapId = state.map.id;
    this.tile = state.map.tile || 40;

    let s = 0;
    for (let i = 0; i < state.map.id.length; i++) s = (s * 31 + state.map.id.charCodeAt(i)) % 100000;
    this._seed = s + 1;
    this._worldW = state.map.cols * this.tile;
    this._worldH = state.map.rows * this.tile;
    this._blocked = state.map.blocked;
    this._zoneMap = new Map();
    for (const z of state.map.zones || []) this._zoneMap.set(z.c + "," + z.r, z.type);

    const theme = THEMES[state.map.theme] || THEMES.forest;
    this._theme = theme;
    const skyTop = new THREE.Color("#e6f5d8");
    const skyBottom = new THREE.Color("#a9d49a");
    this.scene.background = this._makeGradientTexture(skyTop, skyBottom);
    this.scene.fog = new THREE.Fog(skyBottom.getHex(), this._worldW * 0.9, this._worldW * 2.4);

    this.target.set(this._worldW / 2, 0, this._worldH / 2);
    this.dist = Math.max(this._worldW, this._worldH) * 0.92;

    this._clearScene();
    this._buildTerrain(state);
    this._buildPath(state);
    this._buildSlots(state);
    this._buildBase(state);
    this._buildDecorations(state);
    this._sceneBuilt = true;
  }

  _clearScene() {
    for (const k of ["_terrain", "_pathGroup", "_slotsGroup", "_baseGroup", "_decoGroup"]) {
      const o = this[k];
      if (o) this.scene.remove(o);
      this[k] = null;
    }
    for (const m of [this._towers, this._enemies, this._projectiles]) {
      for (const v of m.values()) this.scene.remove(v.obj);
      m.clear();
    }
  }

  _cellColor(c, r) {
    const theme = this._theme;
    const key = c + "," + r;
    if (this._blocked.has(key)) {
      return new THREE.Color(theme.pathCenter || "#d4b248");
    }
    const zt = this._zoneMap.get(key);
    if (zt && ZONE_TYPES[zt] && ZONE_TYPES[zt].glowColor) {
      return new THREE.Color(ZONE_TYPES[zt].glowColor);
    }
    const n = this._vnoise(c * 0.35 + 3, r * 0.35 + 3);
    const low = new THREE.Color(theme.terrainLow || "#2c4622");
    const high = new THREE.Color(theme.terrainHigh || "#7a9a44");
    const col = low.clone().lerp(high, n);
    const checker = ((c + r) % 2 === 0) ? 1.0 : 0.9;
    return col.multiplyScalar(checker);
  }

  _buildTerrain(state) {
    const cols = state.map.cols, rows = state.map.rows, t = this.tile;
    const positions = [], colors = [], normals = [];
    const idx = [];
    let vi = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x0 = c * t, x1 = (c + 1) * t;
        const z0 = r * t, z1 = (r + 1) * t;
        const h00 = this._heightAtWorld(x0, z0);
        const h10 = this._heightAtWorld(x1, z0);
        const h11 = this._heightAtWorld(x1, z1);
        const h01 = this._heightAtWorld(x0, z1);
        const col = this._cellColor(c, r);
        const verts = [
          [x0, h00, z0], [x1, h10, z0], [x1, h11, z1], [x0, h01, z1],
        ];
        for (const v of verts) { positions.push(v[0], v[1], v[2]); colors.push(col.r, col.g, col.b); normals.push(0, 1, 0); }
        idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
        vi += 4;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(idx);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0.0 });
    this._terrain = new THREE.Mesh(geo, mat);
    this.scene.add(this._terrain);
  }

  _buildPath(state) {
    const t = this.tile;
    const group = new THREE.Group();
    const theme = this._theme;
    const roadCol = new THREE.Color(theme.pathCenter || "#d4b248");
    const roadMat = new THREE.MeshStandardMaterial({ color: roadCol, roughness: 0.85, flatShading: true });
    const curbMat = new THREE.MeshStandardMaterial({ color: roadCol.clone().multiplyScalar(0.65), roughness: 0.95, flatShading: true });
    const pts = state.pathPoints || [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b.x - a.x, dz = b.y - a.y;
      const len = Math.hypot(dx, dz);
      const ang = -Math.atan2(dz, dx);
      const dirX = dx / len, dirZ = dz / len;
      const perpX = -dirZ, perpZ = dirX;
      const cx = (a.x + b.x) / 2, cz = (a.y + b.y) / 2;
      const cy = this._heightAtWorld(cx, cz);
      const road = new THREE.Mesh(new THREE.BoxGeometry(len + t * 0.35, 4, t * 0.8), roadMat);
      road.position.set(cx, cy + 3.5, cz);
      road.rotation.y = ang;
      group.add(road);
      for (const side of [-1, 1]) {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(len + t * 0.35, 7, t * 0.12), curbMat);
        curb.position.set(cx + perpX * side * t * 0.44, cy + 5.5, cz + perpZ * side * t * 0.44);
        curb.rotation.y = ang;
        group.add(curb);
      }
    }
    this._pathGroup = group;
    this.scene.add(group);
  }

  _buildSlots(state) {
    const t = this.tile;
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6f685c, roughness: 0.9, flatShading: true });
    const topMat = new THREE.MeshStandardMaterial({ color: 0x8a8175, roughness: 0.85, flatShading: true });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x5cf0ff, transparent: true, opacity: 0.85 });
    for (const s of state.map.buildSlots || []) {
      const h = this._heightAtWorld(s.x, s.y);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.46, t * 0.5, 5, 18), stoneMat);
      base.position.set(s.x, h + 2.5, s.y);
      group.add(base);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.36, t * 0.42, 4, 18), topMat);
      top.position.set(s.x, h + 5.5, s.y);
      group.add(top);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(t * 0.36, 1.4, 8, 28), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(s.x, h + 7.7, s.y);
      group.add(ring);
      const glow = new THREE.Mesh(new THREE.CircleGeometry(t * 0.32, 24),
        new THREE.MeshBasicMaterial({ color: 0x123a44, transparent: true, opacity: 0.55 }));
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(s.x, h + 7.8, s.y);
      group.add(glow);
    }
    for (const z of state.map.zones || []) {
      const cx = z.c * t + t / 2, cz = z.r * t + t / 2;
      const h = this._heightAtWorld(cx, cz);
      const col = (ZONE_TYPES[z.type] && ZONE_TYPES[z.type].glowColor) || "#ffffff";
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(t * 0.4, t * 0.44, 7, 20),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), emissive: new THREE.Color(col), emissiveIntensity: 0.45, roughness: 0.6, flatShading: true })
      );
      pad.position.set(cx, h + 4, cz);
      group.add(pad);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(t * 0.4, 1.2, 8, 24),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 0.8 }));
      halo.rotation.x = Math.PI / 2;
      halo.position.set(cx, h + 7.6, cz);
      group.add(halo);
    }
    this._slotsGroup = group;
    this.scene.add(group);
  }

  _buildBase(state) {
    const b = state.base;
    const t = this.tile;
    const h = this._heightAtWorld(b.x, b.y);
    const group = new THREE.Group();
    group.position.set(b.x, h, b.y);
    const stone = new THREE.MeshStandardMaterial({ color: 0x8a8f9c, roughness: 0.85, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x5a5f6b, roughness: 0.9, flatShading: true });
    const found = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.66, t * 0.74, 10, 18), dark);
    found.position.y = 5; group.add(found);
    const bodyH = 34;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.5, t * 0.58, bodyH, 18), stone);
    body.position.y = 10 + bodyH / 2; group.add(body);
    const topY = 10 + bodyH;
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(t * 0.13, 9, t * 0.13), dark);
      merlon.position.set(Math.cos(a) * t * 0.5, topY + 4, Math.sin(a) * t * 0.5);
      group.add(merlon);
    }
    const gate = new THREE.Mesh(new THREE.BoxGeometry(t * 0.3, 18, 5), dark);
    gate.position.set(0, 17, t * 0.56); group.add(gate);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(t * 0.58, 18, 4), stone);
    roof.position.y = topY + 9; roof.rotation.y = Math.PI / 4; group.add(roof);
    const flag = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x4cc9f0, emissive: 0x2a9fd0, emissiveIntensity: 0.6 }));
    flag.position.y = topY + 24; group.add(flag);

    this._shield = new THREE.Mesh(
      new THREE.SphereGeometry(t * 0.95, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    this._shield.position.y = 28;
    this._shield.visible = false;
    group.add(this._shield);

    this._baseGroup = group;
    this.scene.add(group);
  }

  _makeTree(type, s) {
    const g = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d22, roughness: 0.9, flatShading: true });
    if (type === 1) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.3 * s, 1.8 * s, 7 * s, 6), trunkMat);
      trunk.position.y = 3.5 * s; g.add(trunk);
      const greens = [0x274d22, 0x2f5a2a, 0x3c6b30];
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry((7.5 - i * 1.8) * s, 9 * s, 7),
          new THREE.MeshStandardMaterial({ color: greens[i % 3], flatShading: true, roughness: 0.9 })
        );
        cone.position.y = (7 + i * 5) * s; g.add(cone);
      }
    } else if (type === 2) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.5 * s, 2.0 * s, 8 * s, 6), trunkMat);
      trunk.position.y = 4 * s; g.add(trunk);
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0x4a7d39, flatShading: true, roughness: 0.85 });
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(7 * s, 10, 8), canopyMat);
      c1.position.y = 13 * s; g.add(c1);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(4.5 * s, 8, 7), canopyMat);
      c2.position.set(4 * s, 10 * s, 2 * s); g.add(c2);
    } else if (type === 3) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x3c6b30, flatShading: true, roughness: 0.9 });
      const offs = [[0, 0, 4.5], [4 * s, 1 * s, 3.5], [-3.5 * s, -1 * s, 3.8]];
      for (const [ox, oy, rr] of offs) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(rr * s, 8, 7), mat);
        b.position.set(ox, rr * s + 1, oy); g.add(b);
      }
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: 0x8a8f99, flatShading: true, roughness: 0.95 });
      const offs = [[0, 0, 3.5], [5 * s, 1 * s, 4.5], [-4 * s, -1 * s, 3]];
      for (const [ox, oy, rr] of offs) {
        const r = new THREE.Mesh(new THREE.IcosahedronGeometry(rr * s, 0), mat);
        r.position.set(ox, rr * s * 0.7, oy); g.add(r);
      }
    }
    return g;
  }

  _buildDecorations(state) {
    const group = new THREE.Group();
    for (const d of state.map.decorations || []) {
      const s = d.scale || 1;
      const tree = this._makeTree(d.type, s);
      const h = this._heightAtWorld(d.x, d.y);
      tree.position.set(d.x, h, d.y);
      tree.rotation.y = this._hash(Math.floor(d.x), Math.floor(d.y)) * Math.PI * 2;
      group.add(tree);
    }
    this._decoGroup = group;
    this.scene.add(group);
  }

  _accentMat(color, emi = 0.45) {
    const c = new THREE.Color(color);
    return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: emi, roughness: 0.5, flatShading: true });
  }

  _towerTop(typeIndex, color, t) {
    const g = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0x9a9387, roughness: 0.9, flatShading: true });
    const stoneDark = new THREE.MeshStandardMaterial({ color: 0x6f685c, roughness: 0.95, flatShading: true });
    const acc = this._accentMat(color);

    if (typeIndex === 0) {
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + Math.PI / 4;
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(6, 9, 6), stoneDark);
        merlon.position.set(Math.cos(a) * t * 0.26, 4.5, Math.sin(a) * t * 0.26);
        g.add(merlon);
      }
      const pivot = new THREE.Mesh(new THREE.SphereGeometry(t * 0.12, 10, 8), acc);
      pivot.position.y = 9; g.add(pivot);
      const bow = new THREE.Mesh(new THREE.TorusGeometry(t * 0.16, 2, 6, 16, Math.PI), acc);
      bow.position.y = 9; bow.rotation.x = Math.PI / 2;
      g.add(bow);
    } else if (typeIndex === 1) {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(t * 0.28, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), stone);
      g.add(dome);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.1, t * 0.13, t * 0.55, 12), acc);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(t * 0.2, t * 0.12, 0);
      g.add(barrel);
      const muzzle = new THREE.Mesh(new THREE.TorusGeometry(t * 0.1, 1.4, 6, 12), stoneDark);
      muzzle.rotation.y = Math.PI / 2;
      muzzle.position.set(t * 0.47, t * 0.12, 0);
      g.add(muzzle);
    } else if (typeIndex === 2) {
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(t * 0.18, 0), this._accentMat(color, 0.7));
      core.scale.y = 2.0; core.position.y = t * 0.2; g.add(core);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + 0.5;
        const cr = new THREE.Mesh(new THREE.OctahedronGeometry(t * 0.12, 0), this._accentMat(0xaee9ff, 0.6));
        cr.scale.y = 1.6;
        cr.position.set(Math.cos(a) * t * 0.16, t * 0.1, Math.sin(a) * t * 0.16);
        cr.rotation.y = a;
        g.add(cr);
      }
    } else {
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.24, t * 0.12, 9, 12), stone);
      bowl.position.y = 5; g.add(bowl);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(t * 0.17, t * 0.42, 10),
        new THREE.MeshStandardMaterial({ color: 0xff7a1e, emissive: 0xff5a00, emissiveIntensity: 0.9, roughness: 0.4, flatShading: true }));
      flame.position.y = 15; g.add(flame);
      const ember = new THREE.Mesh(new THREE.SphereGeometry(t * 0.08, 8, 8), this._accentMat(0xffd166, 0.9));
      ember.position.y = 22; g.add(ember);
    }
    return g;
  }

  _addTower(tower, state) {
    const t = this.tile;
    const h = this._heightAtWorld(tower.x, tower.y);
    const group = new THREE.Group();
    group.position.set(tower.x, h, tower.y);

    const stone = new THREE.MeshStandardMaterial({ color: 0x9a9387, roughness: 0.9, flatShading: true });
    const stoneDark = new THREE.MeshStandardMaterial({ color: 0x6f685c, roughness: 0.95, flatShading: true });

    const found = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.44, t * 0.48, 7, 16), stoneDark);
    found.position.y = 3.5; group.add(found);
    const bodyH = 24;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.3, t * 0.37, bodyH, 14), stone);
    body.position.y = 7 + bodyH / 2; group.add(body);

    const lv = tower.level || 0;
    for (let i = 0; i < lv; i++) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(t * 0.37, 1.5, 6, 18), stoneDark);
      band.rotation.x = Math.PI / 2;
      band.position.y = 7 + 8 + i * 8;
      group.add(band);
    }

    const top = this._towerTop(tower.typeIndex, TOWER_TYPES[tower.typeIndex].color, t);
    top.position.y = 7 + bodyH;
    group.add(top);

    this.scene.add(group);
    const obj = { kind: "tower", obj: group, top, level: tower.level, branch: tower.branch };
    this._towers.set(tower, obj);
    return obj;
  }

  _enemyTexture(type) {
    let entry = this._enemyTexCache.get(type);
    if (entry && entry.version === this._enemyTexVersion) return entry.tex;

    const S = 128;
    const c = document.createElement("canvas");
    c.width = S; c.height = S;
    const ctx = c.getContext("2d");
    const fake = {
      type, x: S / 2, y: S / 2, radius: S * 0.3,
      flying: false, invisible: false, hitFlash: 0, shield: 0,
    };
    drawEnemy(ctx, fake, 0);

    const tex = new THREE.CanvasTexture(c);
    if ("SRGBColorSpace" in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    entry = { tex, version: this._enemyTexVersion };
    this._enemyTexCache.set(type, entry);
    return tex;
  }

  _addEnemy(enemy) {
    const t = this.tile;
    const h = this._heightAtWorld(enemy.x, enemy.y);
    const r = enemy.radius || 10;
    const isBoss = !!enemy.boss;
    const size = (isBoss ? r * 1.8 : r) * 2.4;

    const tex = this._enemyTexture(enemy.type);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);

    const group = new THREE.Group();
    const yOff = enemy.flying ? 34 : size * 0.5 + 2;
    group.position.set(enemy.x, h + yOff, enemy.y);
    group.add(mesh);

    const bar = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(26, 4),
      new THREE.MeshBasicMaterial({ color: 0x220000 }));
    const fg = new THREE.Mesh(new THREE.PlaneGeometry(26, 4),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
    fg.position.z = 0.1;
    bar.add(bg); bar.add(fg);
    bar.position.y = size * 0.5 + 12;
    group.add(bar);

    this.scene.add(group);
    const obj = {
      kind: "enemy", obj: group, mesh, bar, fg, mat, lastRatio: -1,
      type: enemy.type, texVersion: this._enemyTexVersion, yOff, size,
    };
    this._enemies.set(enemy, obj);
    return obj;
  }

  _addProjectile(p) {
    const t = this.tile;
    const h = this._heightAtWorld(p.x, p.y);
    const color = new THREE.Color(p.color || "#ffffff");
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(4, 10, 10),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.set(p.x, h + 20, p.y);
    this.scene.add(mesh);
    const obj = { kind: "projectile", obj: mesh };
    this._projectiles.set(p, obj);
    return obj;
  }

  _sync(list, map, factory) {
    const seen = new Set();
    for (const e of list) {
      seen.add(e);
      let o = map.get(e);
      if (!o) o = factory(e);
      this._updateEntity(e, o);
    }
    for (const [e, o] of map) {
      if (!seen.has(e)) {
        this.scene.remove(o.obj);
        map.delete(e);
      }
    }
  }

  _updateEntity(e, o) {
    if (o.kind === "tower") {
      const lv = (e.level || 0);
      if (o.level !== e.level || o.branch !== e.branch) {
        o.level = e.level; o.branch = e.branch;
        o.top.scale.setScalar(1 + 0.12 * lv);
      }
      const c = (e.disabledTimer > 0) ? 0xef476f : new THREE.Color(TOWER_TYPES[e.typeIndex].color);
      o.top.traverse((m) => { if (m.material && m.material.emissive) m.material.emissive.set(c); });
      return;
    }
    if (o.kind === "enemy") {
      if (o.texVersion !== this._enemyTexVersion) {
        o.mat.map = this._enemyTexture(o.type);
        o.mat.needsUpdate = true;
        o.texVersion = this._enemyTexVersion;
      }
      const h = this._heightAtWorld(e.x, e.y);
      const bob = e.flying ? Math.sin(e.x * 0.05 + e.y * 0.05) * 3 : Math.sin(e.x * 0.05 + e.y * 0.03) * 1.5;
      o.obj.position.set(e.x, h + o.yOff + bob, e.y);
      const ratio = Math.max(0, Math.min(1, e.hp / e.maxHp));
      if (Math.abs(ratio - o.lastRatio) > 0.01) {
        o.fg.scale.x = Math.max(0.001, ratio);
        o.fg.position.x = -13 * (1 - ratio);
        o.fg.material.color.setHex(ratio > 0.5 ? 0x4ade80 : ratio > 0.25 ? 0xfacc15 : 0xef4444);
        o.lastRatio = ratio;
      }
      o.obj.quaternion.copy(this.camera.quaternion);
      if (e.burnTimer > 0) o.mat.color.setHex(0xff7a1e);
      else o.mat.color.setHex(0xffffff);
      return;
    }
    if (o.kind === "projectile") {
      o.obj.position.set(e.x, this._heightAtWorld(e.x, e.y) + 20, e.y);
    }
  }

  _updateCamera() {
    const r = this.dist;
    const x = this.target.x + r * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.target.y + r * Math.cos(this.phi);
    const z = this.target.z + r * Math.sin(this.phi) * Math.cos(this.theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  screenToCell(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * 2 - 1;
    const py = -(((clientY - rect.top) / rect.height) * 2 - 1);
    this._ndc.set(px, py);
    this.raycaster.setFromCamera(this._ndc, this.camera);
    const pt = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, pt)) return null;
    return { c: Math.floor(pt.x / this.tile), r: Math.floor(pt.z / this.tile) };
  }

  draw(state) {
    this._ensureMap(state);
    const w = this.canvas.width, h = this.canvas.height;
    if (this.renderer.domElement.width !== w || this.renderer.domElement.height !== h) {
      this.renderer.setSize(w, h, false);
    }
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this._updateCamera();

    this._sync(state.torres, this._towers, (e) => this._addTower(e, state));
    this._sync(state.enemigos, this._enemies, (e) => this._addEnemy(e));
    this._sync(state.proyectiles, this._projectiles, (e) => this._addProjectile(e));

    if (this._shield) this._shield.visible = (state.baseShield || 0) > 0;

    this._updateOverlay(state);

    this.renderer.render(this.scene, this.camera);
  }

  _updateOverlay(state) {
    const t = this.tile;
    const sel = state.selectedTowerEntity;
    const setRing = (x, z, rr, colorHex) => {
      if (this._ringR !== rr) {
        this.rangeRing.geometry.dispose();
        this.rangeRing.geometry = new THREE.RingGeometry(Math.max(1, rr - 2.5), rr, 56);
        this._ringR = rr;
      }
      this.rangeRing.position.set(x, this._heightAtWorld(x, z) + 6, z);
      this.rangeRing.material.color.setHex(colorHex);
      this.rangeRing.visible = true;
    };

    if (sel) {
      setRing(sel.x, sel.y, Math.max(2, sel.range || 100), 0x4cc9f0);
    }

    const hc = state.hoverCell;
    if (hc) {
      const key = hc.c + "," + hc.r;
      const cost = towerStats(state.selectedTower, 0).cost;
      const ok = !state.blocked.has(key) && hc.c >= 0 && hc.r >= 0 &&
        hc.c < state.map.cols && hc.r < state.map.rows &&
        state.oro >= cost && !state.torres.some((tt) => tt.c === hc.c && tt.r === hc.r);
      const cx = hc.c * t + t / 2, cz = hc.r * t + t / 2;
      const h = this._heightAtWorld(cx, cz);
      this.hoverTile.position.set(cx, h + 4, cz);
      this.hoverTile.material.color.setHex(ok ? 0x4cc9f0 : 0xef476f);
      this.hoverTile.visible = true;
      if (!sel) setRing(cx, cz, towerStats(state.selectedTower, 0).range, ok ? 0x4cc9f0 : 0xef476f);
    } else {
      this.hoverTile.visible = false;
    }
  }

  dispose() {
    try {
      this.renderer.forceContextLoss();
      this.renderer.dispose();
    } catch (_) {}
  }
}

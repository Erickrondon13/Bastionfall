# Fase 18 — Dirección artística y arquitectura visual (análisis previo a código)

> Fase 0 del rediseño visual de Bastionfall (`fases/fase 4 maquetacion.md`).
> Objetivo: analizar el repositorio y proponer la arquitectura de render **sin modificar la lógica de juego**.
> La implementación por fases (19→36) se hará tras aprobar esta propuesta.

---

## 1. Hallazgos del análisis

### Coordenadas y render actual
- El mundo usa **coordenadas de píxel = coordenadas de mundo**. Los objetos (`enemy.x/y`, `tower.x/y`, `projectile.x/y`, `base.x/y`, `pathPoints`) ya viven en el espacio de pantalla de 760×520.
- Todos los mapas son `19×13` con `tile=40` → **760×520 exactos**, encajan en el canvas fijo (`index.html:256` `<canvas width="760" height="520">`). No hay DPR/scroll/cámara hoy.
- `Renderer.draw()` dibuja directamente en `ctx` con esas coordenadas; no hay capa de transformación.
- `Input.cellFromEvent()` convierte pantalla→celda con `Math.floor(x / tile)` (escala CSS incluida). Es la **única** inversa hoy.

### Dónde se "toca" el pixel-world (superficie de cambio)
- `src/render/Renderer.js` (terreno, zonas, caminos, torres, enemigos, proyectiles, hover, rango, floaters, boss bar, flash).
- `src/render/art.js` (todas las primitivas de dibujo: `drawTower`, `drawEnemy`, `drawProjectile`, `drawTerrain`, `drawPath`, `drawBase`).
- `src/ui/Input.js` (`cellFromEvent`).
- `src/main.js` (crea canvas/renderer/input; loop).

### Lo que NO hay que tocar
- `src/core/**`, `src/entities/**`, `src/systems/**`, `src/config/**` (salvo añadir config de render), `src/audio/**`, `src/ui/Hud.js`, `src/ui/LevelSelect.js`, `src/ui/Overlay.js`, `src/ui/TechMenu.js`.
- Movimiento, pathfinding, colisiones, rangos, selección de torres: **siguen en coordenadas de mundo**. El renderer es el único que traduce a pantalla.

### Conclusión clave
Existe una costura limpia: **todo objeto ya expresa su posición en "píxel-mundo"**. Basta introducir una capa `Camera` que mapee *píxel-mundo → pantalla* y su inversa *pantalla → píxel-mundo*. La lógica de gameplay queda intacta.

---

## 2. Arquitectura visual propuesta

### Cadena de transformación
```text
tile / entidad (coordenadas de mundo en px)
        │
        ▼
   Camera.applyTransform(ctx)   → world → screen
        │
        ▼
   Canvas 2D
```
Y para el input:
```text
evento de ratón (CSS px) → Camera.screenToWorld() → celda/tile
```

### Nuevos archivos
```
src/config/render.js      # renderConfig: { cameraMode: "topdown" | "isometric" }
src/render/Camera.js      # Camera: applyTransform(ctx), screenToWorld(x,y), fit()
```

### Modificaciones mínimas
- `Renderer.draw(state)`:
  - `clearRect` en espacio de pantalla (usar `canvas.width/height`).
  - `ctx.save()` + `camera.applyTransform(ctx)` para **toda la capa mundo** (terreno→proyectiles→floaters→hover→rango).
  - `ctx.restore()` y dibujar **UI fija de pantalla** sin transformar (boss bar, flash). Hoy ambos usan `W=map.cols*tile`; pasarán a usar `canvas.width`.
- `Input.cellFromEvent()`: en vez de `/tile`, usar `camera.screenToWorld(x,y)` y luego `/tile`.
- `main.js`: instanciar `Camera` y pasarla a `Renderer` e `Input`.

### Modo `cameraMode` (toggle seguro)
- `"topdown"` (por defecto): transformación identidad → **comportamiento actual exacto**, cero riesgo.
- `"isometric"`: proyección 2.5D inclinada. Se activa/desactiva en caliente (botón/tecla) para comparar ambas vistas durante el desarrollo.

---

## 3. Plan de fases (a ejecutar una por una, probada y documentada)

| Fase | Entregable | Riesgo |
|------|-----------|--------|
| **19** | `Camera.js` + `renderConfig` + toggle topdown/isometric (isometric = transformación afín simple: tilt + escala + centrado, con inversa correcta en Input). | Bajo (topdown idéntico) |
| **20** | Profundidad/orden de render (z-sorting por `y`/`tile`) y `screenToWorld` robusto. | Bajo |
| **21** | Tiles de terreno con variación y bordes (procedural, sin assets). | Bajo |
| **22** | Camino integrado al terreno. | Bajo |
| **23** | Torres con volumen (sombra + cuerpo + altura). | Medio |
| **24** | Enemigos con identidad visual (formas vectoriales/estilizadas). | Medio |
| **25** | Animaciones idle/ataque/muerte (procedural). | Medio |
| **26** | Iluminación (gradientes/overlays). | Medio |
| **27** | Sombras y separación de capas. | Bajo |
| **28** | Biblioteca de efectos (explosión, hielo, fuego…). | Medio |
| **29** | HUD integrado con la estética. | Medio |
| **30** | Menús/pantallas. | Medio |
| **31** | Mapa de campaña visual. | Alto |
| **32** | Presentación cinematográfica de boss. | Medio |
| **33** | Pipeline de assets (cuando se usen PNG). | Bajo |
| **34** | Optimización (caching, culling). | Bajo |
| **35** | Responsive de cámara. | Medio |
| **36** | Pulido final / QA. | Bajo |

**Prioridad del doc**: Fases 18–22 (dirección → cámara → proyección → tiles → terreno) son la base; una vez sólidas, el resto se construye encima.

## 4. Restricciones
HTML5 Canvas · ES Modules · sin frameworks · no romper Campaña/Infinito/localStorage/input/mobile · no tocar `Game.js` salvo estrictamente necesario · no mezclar render con gameplay.

## 5. Estado de implementación

- [x] **Fase 18 — Análisis y arquitectura** (este documento). Sin modificar lógica de juego.
- [x] **Fase 19 — Cámara 2.5D + toggle**: `src/config/render.js` (`renderConfig.cameraMode`),
      `src/render/Camera.js` (matriz afín `world↔screen`, soporta tilt/rotación para fases futuras) y cableado en
      `Renderer` (capa mundo transformada + UI fija en pantalla) e `Input` (inversa `screenToWorld`). Botón "Vista"
      en el menú y tecla `V` alternan `topdown`/`isometric` en caliente para comparar. `topdown` es idéntico al
      render anterior (sin regresión); `isometric` aplica tilt Y (0.62) + centrado y mantiene el input correcto.

## 6. Siguiente paso sugerido
Implementar **Fase 20 — Proyección isométrica y profundidad**: añadir z-sorting por `tile`/`y` y refinar la
proyección (rotación 45° en diamante opcional) sobre la base de la cámara de Fase 19. No avanzar a Fase 21 hasta
completar, probar y documentar Fase 20.

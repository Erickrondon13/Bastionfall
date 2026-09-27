# ARCHITECTURE.md — Propuesta de arquitectura escalable

Análisis del repositorio actual de **Oleada Defensa** y propuesta para crecer
sin convertir el proyecto en un monolito. Generado a partir de la Fase 1
(`docs/FASES.md`), sin modificar la lógica existente de `index.html`.

---

## 1. Estructura encontrada

```
Bastionfall/
├── index.html          # TODO el juego: HTML + CSS + JS en un solo archivo
├── README.md
├── PROMPT_OPENCODE.md
├── contexto.md
└── docs/
    └── FASES.md
```

`index.html` contiene un único `<script>` en una IIFE con:

- **Constantes globales**: `COLS`, `ROWS`, `TILE`, `W`, `H`.
- **Config embebida**: `TOWER_TYPES`, `ENEMY_TYPES`, `PATH_CELLS`/`pathPoints`.
- **Estado central**: un objeto `state` (`newState()`) con vida, oro, oleada,
  arrays de `torres`, `enemigos`, `proyectiles`, flags.
- **Lógica de oleadas**: `buildWave`, `startWave`, `spawnEnemy`.
- **Lógica de colocación**: `tryPlaceTower`, `blocked` (Set de celdas).
- **Bucle único `update()`**: spawning, movimiento de enemigos, targeting de
  torres, proyectiles e recolección de muertes, todo acoplado.
- **Render único `draw()`**: terreno, ruta, base, torres, enemigos, proyectiles.
- **UI/HUD/Input/Overlay**: funciones y listeners mezclados con el gameplay.

Funciona como MVP 0, pero todo vive en un solo archivo y un solo frame loop.

## 2. Problemas detectados

1. **Monolito de `update()`/`draw()`**: cada nueva mecánica (Fases 3–9) obliga a
   editar una función gigante. Alto riesgo de regresiones.
2. **Config y lógica acopladas**: cambiar el balance o añadir una torre implica
   tocar código de ejecución.
3. **Ruta hardcodeada**: la Fase 2 (mapas) no tiene dónde apoyarse.
4. **Estado mutable global**: `state` se pasa implícitamente por closure; difícil
   testear o reproducir partidas.
5. **Sin módulos ni build**: no hay separación de archivos ni carga tipada.
6. **Sin assets/pipeline**: la Fase 14 (arte) necesitará un sistema de carga.
7. **Sin sistema de eventos**: economía, audio (Fase 10) y UI dependen de
   llamadas directas en vez de eventos desacoplados.

## 3. Arquitectura propuesta

Patrón **sistemas por frame** (estilo ECS ligero) con módulos ES nativos
(`type="module"`), sin frameworks ni dependencias de build para el prototipo.

Capas:

```
core/        Bucle, estado, eventos, tiempo (dt)
config/      Datos puros: torres, enemigos, oleadas, mapas
entities/    Torre, Enemigo, Proyectil (datos + comportamiento mínimo)
systems/     Una responsabilidad cada uno: spawn, movimiento, combate, economía
render/      Renderer desacoplado de la lógica (lee estado, dibuja)
ui/          HUD, input, overlay, menús
maps/        Definiciones de mapa en JSON/datos
```

Principios:
- **Separar datos de comportamiento**: `config/` nunca importa lógica.
- **Sistemas puros**: cada `system.update(state, dt, events)` solo hace su tarea.
- **Bus de eventos**: `events.emit('enemy:killed', {...})` para UI/audio/economía.
- **Estado inmutable por frame**: los sistemas reciben y devuelven/modifican un
  `GameState` explícito, no por closure global.
- **Render por capas**: el `Renderer` itera entidades; no contiene reglas.

### Diagrama de flujo por frame

```
GameLoop
  └─> events.clear()
  └─> SpawnSystem(state, dt, events)
  └─> MovementSystem(state, dt, events)
  └─> CombatSystem(state, dt, events)   → emite 'enemy:killed'
  └─> EconomySystem(state, events)      → escucha 'enemy:killed'
  └─> Renderer.draw(state)
  └─> Hud.update(state)
```

## 4. Archivos que se recomienda crear

```
index.html                 # pasa a cargar src/main.js como módulo
src/
  main.js                  # arranque, instancia Game
  core/
    Game.js                # orquesta loop + sistemas + estado
    Loop.js                # requestAnimationFrame con dt
    EventBus.js            # emisión/suscripción de eventos
    GameState.js           # definición y factory de estado
  config/
    towers.js              # TOWER_TYPES
    enemies.js             # ENEMY_TYPES
    waves.js               # buildWave / compositor de oleadas
    maps.js                # registro de mapas y rutas
  entities/
    Tower.js
    Enemy.js
    Projectile.js
  systems/
    SpawnSystem.js
    MovementSystem.js
    CombatSystem.js
    EconomySystem.js
  render/
    Renderer.js
    layers/ (Terrain, Path, Towers, Enemies, Projectiles)
  ui/
    Hud.js
    Input.js
    Overlay.js
  maps/
    default.json           # ruta del MVP actual como dato
docs/
  ARCHITECTURE.md          # este documento
```

Migración sugerida: mover primero `config/` (sin riesgo), luego extraer
`systems/` uno a uno desde `update()`, y finalmente `render/` desde `draw()`.
En cada paso el juego debe seguir jugable.

## 5. Siguiente paso recomendado

**FASE 2 (Mapas) como primer refactor real**: extraer `PATH_CELLS` a
`src/maps/default.json` + `src/config/maps.js`, y que el `MovementSystem` lea la
ruta desde el estado del mapa en vez de la constante global. Esto valida la
separación config→lógica con el cambio mínimo de riesgo, y deja la puerta abierta
a múltiples mapas para la campaña (Fase 8).

Después: Fase 3 (oleadas avanzadas) apoyándose en `config/waves.js` + `EventBus`.

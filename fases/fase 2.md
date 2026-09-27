# Fase 2 — Desarrollo continuo (Bastionfall)

Esta es la **segunda fase** de desarrollo de Bastionfall, tras completar las fases
1–17 del `docs/FASES.md`. Agrupa mejoras de alcance medio que amplían la
rejugabilidad sin reescribir la arquitectura.

## Objetivo de esta entrega

Implementar **modos de juego** como base extensible para el resto del backlog
(`fase 2/IDEAS.md`):

- **Campaña** (modo actual): oleadas finitas por etapa, con jefe final.
- **Infinito**: oleadas sin fin con escalado de dificultad; la partida termina solo
  cuando la base cae.

## Diseño

- `src/config/modes.js`: definición de modos (`campaign`, `endless`).
- `Game.mode`: modo activo; `Game.setMode(id)` lo cambia y regenera el estado.
- `GameState.endless` / `totalOleadas = Infinity` para el modo infinito.
- `SpawnSystem`: la victoria solo se da cuando `oleada >= totalOleadas`; con
  `Infinity` nunca se gana, pero sí se puede perder.
- `buildWave(n, totalWaves)`: el jefe solo aparece si `n === totalWaves`; en infinito
  `totalWaves` es `Infinity`, así que no hay jefe y las oleadas siguen escalando.
- HUD: muestra `oleada / ∞` en modo infinito.
- Menú inicial: selector de modo (Campaña / Infinito) que aplica al reanudar.

## Pruebas

- Headless: seleccionar modo infinito y verificar que `totalOleadas` es `Infinity`
  y que tras completar oleadas no se marca `victory`.
- El modo campaña conserva el comportamiento anterior (victoria en la oleada final
  con jefe).

## Backlog pendiente (ver `fase 2/IDEAS.md`)

Clima/eventos, más torres (veneno, rayo, apoyo, empujador), habilidades del
jugador, logros, editor de mapas, biomas, accesibilidad, i18n, Web Worker y
tutorial. Cada item puede implementarse como un commit independiente.

## Sistemas añadidos en esta fase (2ª entrega)

### Cavernas aleatorias
- `src/config/mapgen.js`: genera mapas tipo cueva con un camino aleatorio
  conectado de entrada a base; 4 dificultades (`básico/medio/experto/avanzado`).
- Una **caverna** son **5 mapas** generados (`generateCavern`) cuyas clasificaciones
  rampanean de básico a avanzado (`cavernMapTiers`).
- `Game.startCavern(tier)` / `loadGenMap(i)`: encadena los 5 mapas; al ganar un mapa
  intermedio avanza al siguiente (`_pendingCavernAdvance` tras el bucle de sistemas).
- El `hpMult` escala el PV de los enemigos según la dificultad del mapa.

### Llaves, cofres y recompensa por cavernas
- Cada **victoria** → +1 llave (`Progression.addKey`); cada **5 llaves** → cofre
  (+40 esencia).
- Completar **5 cavernas de un nivel** → hito (+200 esencia, `recordCavernComplete`).
- El HUD y el overlay de victoria muestran llaves/cofres/hitos; el menú Cavernas
  lista las 4 dificultades con su contador de completadas.

### Pruebas
- Headless: 300 generaciones sin rutas inválidas; 5 cavernas básicas → 25 llaves,
  5 cofres, 5 completadas, esencia acumulada. Render y servidor OK.

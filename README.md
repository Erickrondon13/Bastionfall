# Bastionfall — Tower Defense

Juego de defensa de torres en **HTML5 Canvas**, sin frameworks ni dependencias de build.
Nació como prototipo monolítico (`index.html`) y ahora usa una arquitectura modular por
sistemas (estilo ECS ligero) con módulos ES nativos.

## Cómo ejecutar

Los módulos ES no cargan con `file://`, así que usa el servidor incluido:

```bash
npm start          # arranca en http://localhost:8000
# o bien:
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Controles

| Tecla / Acción | Función |
| --- | --- |
| `1` `2` `3` `4` | Selecciona torre: **Arco**, **Cañón**, **Hielo**, **Fuego** |
| Click en terreno libre | Construye la torre seleccionada |
| Click en una torre | La selecciona |
| `U` | Mejora la torre seleccionada (3 niveles) |
| `X` | Vende la torre seleccionada (60% del oro invertido) |
| `P` | Abre el panel de **Progresión** (árbol de tecnología) |
| `C` | Abre la **Campaña** (selección de etapas) |
| `Esc` | Pausa / reanuda (menú) |
| `Espacio` | Inicia la siguiente oleada |
| `R` | Reinicia la partida |

## Menús (Fase 11)

- **Inicio y pausa**: al cargar y con `Esc` se muestra un menú con Jugar, Reiniciar,
  Campaña, Progresión y ajustes de sonido.
- **Ajustes**: el sonido se puede silenciar; la preferencia se guarda en `localStorage`.
- Las pantallas de **victoria/derrota** permiten reiniciar la partida.

## Móvil (Fase 16)

- Canvas **responsive** que escala al ancho del dispositivo; el mapeo de toques
  se ajusta al factor de escala del canvas.
- Barra táctil con **▶ Oleada**, **▲ Mejorar**, **✕ Vender** y **⏸ Pausa**
  (visible en pantallas pequeñas).
- Los botones de torre y los paneles (Campaña, Progresión, Menú) son táctiles.

## Optimización (Fase 15)

- **Object pooling** de proyectiles en `CombatSystem` para reducir asignaciones y
  presión de GC durante oleadas grandes.

## Balance (Fase 13)

Los números de dificultad están centralizados en `src/config/balance.js` (escalado de
PV por oleada, tamaño de oleada, retraso de spawn, etc.) para ajustar la curva sin
tocar la lógica.

## Pulido (Fase 17)

- **Partículas** al matar enemigos y **screen‑shake** al golpear la base o cambiar de
  fase del jefe, ambos vía el bus de eventos.

## Arte (Fase 14)

Paso de arte **programático** en Canvas (sin assets externos):

- Terreno con gradiente y decoración, camino tipo carretera con bordes.
- **Base tipo castillo** con bandera animada.
- **Torres** con base, anillo de color y **cañón giratorio** que apunta al objetivo.
- **Enemigos con silueta por tipo** (slime, flecha, hexágono blindado, murciélago
  volador, divisor, jefe con corona) y anillo de estado (quemadura/ralentización).
- **Proyectiles** con halo de brillo.
- Fondo con gradiente radial en la página.

## Progresión persistente

Al terminar cada partida (victoria o derrota) ganas **esencia** según las oleadas
superadas. Con esa esencia desbloqueas mejoras permanentes en el panel `P`:

- 🔥 Desbloquear la torre **Fuego**.
- 💰 Oro inicial y ❤️ vida inicial extra.
- 🏹 Bonos de daño por torre y de alcance global.

El progreso se guarda en `localStorage` (`bastionfall.save.v1`), así que persiste
entre sesiones. Ver `docs/FASES.md` (Fase 6 y Fase 12).

## Campaña y estrellas

- **Estrellas (Fase 7):** al ganar recibes 1–3 ★ según vida restante, oro y tiempo.
  Se guarda como récord por mapa/etapa.
- **Campaña (Fase 8):** abre el panel `C` para elegir etapas. Cada etapa desbloquea
  la siguiente al completarla; el progreso de la campaña también persiste.

## Cavernas aleatorias y llaves (Fase 2)

- **Cavernas (menú Cavernas):** generador de mapas procedural tipo "cueva" con 4
  dificultades: **básico, medio, experto, avanzado**. Cada caverna son **5 mapas
  generados al azar** que rampanean de básico a avanzado; el modo se fuerza a
  campaña (finito) durante la caverna.
- **Llaves y cofres:** cada **victoria** otorga **1 llave**. Cada **5 llaves** se
  abre un **cofre** (+40 esencia). El contador persiste en `localStorage`.
- **Recompensa por cavernas:** completar **5 cavernas de un mismo nivel** (p. ej.
  5 cavernas básicas) dispara un **hito** (+200 esencia). El progreso de cavernas
  por nivel también se guarda.
- El generador vive en `src/config/mapgen.js` y el estado en `Game.cavern`; las
  recompensas se gestionan en `Progression` (llaves/cofres/cavernas). Ver
  `fases/fase 2.md`.

## Audio (Fase 10)

Efectos de sonido generados con WebAudio (sin archivos): disparos, oleada,
golpe a la base, victoria y derrota. Se activan con la primera interacción.

## Resiliencia

El bucle de simulación y la persistencia usan patrones de resiliencia
(`src/core/resilience.js`):

- **Circuit breaker**: si un sistema lanza errores repetidos, se aísla (se omite)
  en vez de romper todo el juego.
- **Timeout de frame**: cada sistema tiene un presupuesto de tiempo; un sistema
  demasiado lento se marca como fallo y dispara el breaker.
- **Retry**: la escritura en `localStorage` se reintenta con reintentos acotados.
- **Idempotencia**: premios de esencia, compras, récords de estrellas y el inicio
  de oleada son operaciones idempotentes (no se duplican).

## Mecánicas

- 🗺️ **Mapas como datos** (`src/config/maps.js`): "Llanura Asediada" y "Garganta del Cañón".
- 👾 **Enemigos**: básico, rápido, tanque, volador (vuela en línea recta), blindado
  (armadura), divisor (se parte al morir) y un **jefe** con fases, escudo y esbirros
  en la oleada final de cada nivel.
- 🌊 **Oleadas** con dificultad progresiva y compositor (`src/config/waves.js`).
- 🏹 **4 torres**, cada una con 3 niveles de mejora (rango/daño/cadencia).
- 💥 **Proyectiles** con daño directo, área (splash), ralentización y quemadura (DoT).
- 👹 **Jefe (Fase 9)**: barra de vida propia, 3 fases según PV, escudo temporal y
  invoca esbirros; suena una alerta al aparecer y al cambiar de fase.
- ❤️ Vidas, economía y HUD en tiempo real.
- 🧩 **Bus de eventos** (`EventBus`) para desacoplar sistemas de UI/audio.

## Arquitectura

```
src/
  main.js              # arranque y bucle
  core/                # Game, Loop, EventBus, GameState
  config/              # mapas, torres, enemigos, oleadas (datos puros)
  entities/            # Tower, Enemy, Projectile
  systems/             # Spawn, Movement, Combat, Economy
  render/Renderer.js   # dibuja leyendo el estado (sin reglas)
  ui/                  # Hud, Input, Overlay
```

Cada sistema es una responsabilidad aislada: `update(state, events)`. El `Renderer`
solo lee el estado. Ver `docs/ARCHITECTURE.md` para el diseño completo.

## Roadmap (`docs/FASES.md`)

Implementado el juego completo según `docs/FASES.md`: todas las fases (1–17),
incluida la **Fase 14 (arte)** mediante dibujo programático en Canvas. El juego es
plenamente jugable en escritorio y móvil, con campaña, progresión, jefes, audio,
resiliencia y efectos. Los ajustes finos de balance/QA quedan como pulido continuo.

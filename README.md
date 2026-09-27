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
| `Espacio` | Inicia la siguiente oleada |
| `R` | Reinicia la partida |

## Mecánicas

- 🗺️ **Mapas como datos** (`src/config/maps.js`): "Llanura Asediada" y "Garganta del Cañón".
- 👾 **Enemigos**: básico, rápido, tanque, volador (vuela en línea recta), blindado
  (armadura), divisor (se parte al morir) y un **jefe** en la oleada 10.
- 🌊 **Oleadas** con dificultad progresiva y compositor (`src/config/waves.js`).
- 🏹 **4 torres**, cada una con 3 niveles de mejora (rango/daño/cadencia).
- 💥 **Proyectiles** con daño directo, área (splash), ralentización y quemadura (DoT).
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

Implementado hasta la **Fase 5** (enemigos avanzados). Próximas: progresión
persistente, estrellas, campaña, jefes adicionales, audio/efectos, menús, guardado
(`localStorage`), balance, arte, optimización, móvil y pulido.

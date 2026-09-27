# Oleada Defensa — Prototipo

Juego de defensa de torres (tower defense) en HTML5 Canvas, sin frameworks ni dependencias.
Este es el **MVP 0**: un prototipo jugable que sirve de base para convertirlo
progresivamente en un juego más completo siguiendo `docs/FASES.md`.

## Cómo jugar

Abre `index.html` directamente en el navegador (doble click). No necesita servidor.

- **Objetivo**: sobrevive 10 oleadas sin que la vida de tu base llegue a 0.
- Coloca torres haciendo click en el terreno libre.
- Usa el oro para construir; ganas oro al matar enemigos y al completar oleadas.

## Controles

| Tecla / Acción | Función |
| --- | --- |
| `1` | Selecciona torre **Arco** ($50) |
| `2` | Selecciona torre **Cañón** ($100) |
| `3` | Selecciona torre **Hielo** ($75) |
| Click | Coloca la torre seleccionada |
| `Espacio` | Inicia la siguiente oleada |
| `R` | Reinicia la partida |

## Mecánicas incluidas

- 🗺️ Mapa con ruta fija y base con vida.
- 👾 Enemigos que siguen la ruta: **básico**, **rápido** y **tanque**.
- 🌊 Sistema de oleadas con dificultad progresiva (más enemigos y más PV por oleada).
- 🏰 Base con vida; cada enemigo que llega resta 1.
- 💰 Economía: oro por bajas + bonus por oleada completada.
- 🏹 3 torres: Arco (rápido), Cañón (área/impacto), Hielo (ralentiza).
- 💥 Proyectiles con daño directo y área.
- ❤️ Vidas, oleadas y HUD en tiempo real.

## Siguiente paso

Lee `PROMPT_OPENCODE.md` y `docs/FASES.md` para la hoja de ruta de desarrollo
con OpenCode. La recomendación es: primero gameplay, después arte.
# Bastionfall.

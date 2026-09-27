# FASES.md — Hoja de ruta de Oleada Defensa

Roadmap para convertir el prototipo (`index.html`) en un juego más completo.
Cada fase es independiente: implementar → probar → corregir → commit → siguiente.

> **Estado:** todas las fases (0–17) implementadas ✅. El juego es jugable en
> escritorio y móvil con campaña, progresión, jefes, audio, efectos, arte y
> resiliencia. Ver `README.md` para el detalle.

```
FASE 0  → Prototipo jugable
   ↓
FASE 1  → Arquitectura
   ↓
FASE 2  → Mapas
   ↓
FASE 3  → Sistema avanzado de oleadas
   ↓
FASE 4  → Torres
   ↓
FASE 5  → Enemigos
   ↓
FASE 6  → Progresión
   ↓
FASE 7  → Estrellas
   ↓
FASE 8  → Campaña
   ↓
FASE 9  → Jefes
   ↓
FASE 10 → Audio / efectos
   ↓
FASE 11 → Menús
   ↓
FASE 12 → Guardado
   ↓
FASE 13 → Balance
   ↓
FASE 14 → Arte
   ↓
FASE 15 → Optimización
   ↓
FASE 16 → Móvil
   ↓
FASE 17 → Pulido
```

---

## FASE 0 — Prototipo jugable ✅
Entregado en `index.html`. Mapa, ruta, oleadas, 3 torres, 3 enemigos, economía,
vidas, proyectiles y controles básicos. Base para todo lo demás.

## FASE 1 — Arquitectura
Separar el monolito de `index.html` en módulos reutilizables:
`core/` (loop, estado), `entities/` (Torre, Enemigo, Proyectil), `systems/`
(spawn, combate, economía), `config/` (datos de torres/enemigos/oleadas),
`ui/` (HUD, menús). Definir `docs/ARCHITECTURE.md`.

## FASE 2 — Mapas
Soportar múltiples mapas con rutas definidas por datos (JSON). Editor visual
simple o definición por archivo. Validación de rutas conectadas.

## FASE 3 — Sistema avanzado de oleadas
Compositor de oleadas con patrones, intervalos variables, oleadas infinitas
con escalado, y "modificadores" (ej. enemigos con escudo, velocidad global).

## FASE 4 — Torres
Mejoras por nivel, especializaciones, alcance de área configurable, torres que
se apuntan solas vs. objetivo prioritario, y venta/reembolso.

## FASE 5 — Enemigos
Más tipos (volador, invisible, dividirse al morir), resistencias, estados
(quemado, congelado, envenenado) y comportamientos (grupos, líderes).

## FASE 6 — Progresión
Desbloqueo de torres y mejoras entre partidas, árbol de tecnología, moneda
persistente.

## FASE 7 — Estrellas
Sistema de puntuación por oleada/mapa (3 estrellas según vida restante, oro,
tiempo) para alimentar la campaña.

## FASE 8 — Campaña
Varios niveles encadenados con dificultad creciente y recompensas.

## FASE 9 — Jefes
Enemigos gigantes con fases, habilidades y barras de vida especiales.

## FASE 10 — Audio / efectos
Sonidos de disparo, impacto, oleada; música ambiental; partículas y
animaciones de impacto.

## FASE 11 — Menús
Pantalla de inicio, selección de mapa, pausa, ajustes, game over / victoria.

## FASE 12 — Guardado
Persistencia con `localStorage`: progreso, estrellas, desbloqueos.

## FASE 13 — Balance
Ajuste numérico de economía, daño, vida y curvas de dificultad mediante pruebas.

## FASE 14 — Arte
Sprites, tilesets, animaciones e interfaces con estilo definido.

## FASE 15 — Optimización
Object pooling, batching de render, rendimiento en oleadas grandes.

## FASE 16 — Móvil
Controles táctiles, diseño responsive, escalado de canvas.

## FASE 17 — Pulido
Feedback visual/auditivo, accesibilidad, tutorial, QA final.

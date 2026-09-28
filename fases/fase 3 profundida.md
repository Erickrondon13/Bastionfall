Sí. En realidad, con Fases 0–17 ya tienes el **MVP bastante completo**. A partir de aquí yo dejaría de pensar en “agregar más cosas” y pasaría a una etapa de **profundización del gameplay**: que Bastionfall deje de sentirse como un prototipo con muchas features y empiece a sentirse como un juego.

Te propongo esta evolución:

### 1. Sistema de mapas y dificultad

* 5–10 mapas nuevos.
* Caminos con bifurcaciones.
* Mapas con zonas especiales:

  * pantano → ralentiza enemigos.
  * montaña → aumenta alcance.
  * lava → daño periódico.
  * bosque → reduce alcance.
* Diferentes condiciones de victoria.
* Mapas con 1, 2 y 3 estrellas.
* Récord de tiempo.
* Récord de vida restante.
* Récord de oro.

Esto te permitiría que cada mapa tenga personalidad propia.

---

### 2. Profundizar las torres

Ahora tienes 4 torres. El siguiente salto sería darles **identidad estratégica real**.

Por ejemplo:

| Torre    | Rol                                  |
| -------- | ------------------------------------ |
| 🏹 Arco  | daño rápido a objetivos individuales |
| 💣 Cañón | daño de área                         |
| ❄️ Hielo | control                              |
| 🔥 Fuego | daño progresivo                      |

Después puedes agregar:

* árbol de mejoras A/B.
* mejoras exclusivas.
* habilidades activas.
* estadísticas visibles.
* rango visual.
* DPS calculado.
* daño por segundo.
* críticos.
* sinergias.

Ejemplo:

```text
ARCO
├── Francotirador
│   ├── +alcance
│   └── crítico
│
└── Tirador rápido
    ├── +velocidad
    └── multishot
```

Ahí empieza a aparecer el **build strategy**.

---

### 3. Habilidades activas del jugador

Esto sería una mejora importante.

No solamente colocar torres.

Agregar habilidades:

```text
⚡ Rayo
🔥 Meteorito
❄ Congelación
💰 Bonificación de oro
🛡 Escudo de bastión
```

Con cooldown:

```text
Rayo
██████░░░░  6.2s
```

Esto hace que el jugador tenga que tomar decisiones durante la oleada.

---

### 4. Sistema de enemigos mucho más profundo

Ya tienes volador, blindado y divisor.

Puedes crear:

```text
Enemigo
├── Básico
├── Rápido
├── Blindado
├── Volador
├── Regenerativo
├── Invisible
├── Divisor
├── Curador
├── Invocador
├── Tanque
└── Jefe
```

Y enemigos con comportamiento especial.

Por ejemplo:

**Curador**

```text
      ❤️
   E ───── E
      ↑
   +20 HP/s
```

Obliga al jugador a priorizar objetivos.

---

### 5. Sistema de élites

Esto puede quedar brutal.

Durante una oleada:

```text
⚠ ENEMIGO ÉLITE

BLINDADO
★★★★★

+150% HP
+30% velocidad
+20% recompensa
```

Y que tengan modificadores aleatorios:

```text
🔥 En llamas
❄ Resistente al hielo
⚡ Rápido
🛡 Escudo
👑 Élite
```

Esto genera partidas diferentes sin tener que crear cientos de enemigos.

---

### 6. Modificadores de partida

Aquí puedes empezar a construir un sistema tipo roguelite.

Antes de comenzar:

```text
MODIFICADOR

☠ Enemigos tienen +30% HP
💰 Obtienes +50% oro
⚡ Torres atacan +20% rápido
🔥 Los enemigos dejan fuego
```

El jugador puede elegir:

```text
+ dificultad
      ↓
+ recompensa
```

Esto aumenta muchísimo la rejugabilidad.

---

### 7. Endless realmente interesante

Ahora mismo tienes:

```text
∞ oleadas
```

Pero puedes evolucionarlo.

Cada 10 oleadas:

```text
WAVE 10
Jefe
```

Cada 20:

```text
WAVE 20
Jefe + modificador
```

Y aumentar progresivamente:

```text
HP = base × 1.08^wave
```

Pero además introducir cambios:

```text
Wave 10 → enemigos rápidos
Wave 20 → blindados
Wave 30 → voladores
Wave 40 → regenerativos
Wave 50 → Boss
```

Y leaderboard local:

```text
MEJOR MARCA

Oleada: 47
Tiempo: 31:42
Oro: 18,450
```

---

## 8. Bosses realmente memorables

Ya tienes bosses, así que yo los llevaría un nivel más arriba.

Cada jefe debería tener una mecánica propia.

Ejemplo:

### The Colossus

```text
FASE 1
████████████

FASE 2
██████░░░░░░
Invoca enemigos

FASE 3
███░░░░░░░░░
Entra en furia
```

Otro:

### The Swarm Mother

* genera divisores.
* destruye torres temporalmente.
* cambia de ruta.

Otro:

### The Void Walker

* desaparece.
* teletransporta.
* desactiva habilidades.

Así los bosses dejan de ser simplemente “enemigos con mucha vida”.

---

# 9. Eventos durante las oleadas

Esto puede darle muchísimo dinamismo.

Ejemplo:

```text
⚠ TORMENTA

Durante 15 segundos:
Los proyectiles tienen -30% velocidad.
```

O:

```text
☄ METEOR SHOWER

Los enemigos reciben daño aleatorio.
```

O:

```text
🌑 ECLIPSE

Los enemigos tienen +25% velocidad.
```

Esto hace que una misma oleada no sea completamente predecible.

---

# 10. Sistema de reliquias

Esta sería una de mis siguientes implementaciones.

Después de derrotar un boss:

```text
ELIGE UNA RELIQUIA

⚔ Núcleo de guerra
+15% daño de torres

💰 Corazón dorado
+20% oro

❄ Fragmento glacial
+10% duración de ralentización
```

El jugador escoge una.

Luego:

```text
Reliquias:
⚔ ⚔ 💰 ❄
```

Esto puede convertirse en el corazón del modo **Infinito**.

---

# 11. Sinergias entre torres

Aquí tienes una mina de oro.

Ejemplo:

```text
Hielo + Fuego
      ↓
"Choque térmico"
      ↓
+30% daño
```

O:

```text
Arco + Cañón
      ↓
"Artillería coordinada"
```

Esto hace que el jugador piense:

> “No quiero simplemente torres fuertes; quiero combinaciones fuertes.”

Eso es exactamente lo que quieres en un tower defense.

---

# 12. Sistema de economía más interesante

Actualmente tienes oro.

Puedes agregar:

### Intereses

```text
Oro restante: 500
Interés: +5%
```

### Recompensas por racha

```text
🔥 Racha perfecta x7
+150 oro
```

### Bonus por no perder vidas

```text
❤️❤️❤️❤️❤️

BONUS PERFECTO
+100 oro
```

---

# 13. Sistema de logros

Muy fácil de integrar y da sensación de juego completo.

```text
🏆 PRIMERA DEFENSA
Completa el mapa 1.

🏆 SIN UN RASGUÑO
Termina una partida sin perder vidas.

🏆 ARTILLERO
Elimina 1.000 enemigos con cañón.

🏆 SUPERVIVIENTE
Alcanza la oleada 50.

🏆 CAZADOR DE JEFES
Derrota 10 bosses.
```

Guardados en `localStorage`.

---

# 14. Estadísticas de partida

Al terminar:

```text
══════════════════════
       VICTORIA
══════════════════════

Oleadas       25
Enemigos      384
Jefes         2
Daño total    128.540
Oro ganado    4.820
Oro gastado   3.900

Torres usadas
🏹 4
💣 3
❄ 2
🔥 5

⭐⭐⭐
══════════════════════
```

Y un botón:

```text
[ JUGAR DE NUEVO ]
[ SIGUIENTE MAPA ]
```

---

# 15. Tutorial

Muy recomendable antes de seguir agregando contenido.

Primer mapa:

```text
PASO 1
Coloca una torre.

        ↓

PASO 2
Comienza la oleada.

        ↓

PASO 3
Mejora tu torre.

        ↓

PASO 4
Derrota al enemigo.
```

No necesitas un tutorial enorme.

---

# 16. Guardado de partidas

Ya tienes progreso, pero puedes separar:

```text
Perfil
├── progreso
├── estrellas
├── tecnología
└── logros

Partida
├── mapa
├── oleada
├── oro
├── torres
└── vidas
```

Y permitir:

```text
CONTINUAR PARTIDA
```

---

# 17. Sistema de estadísticas de torres

Al seleccionar una torre:

```text
┌────────────────────────┐
│ 🏹 ARQUERO             │
│                        │
│ Daño       42          │
│ Velocidad  0.65s       │
│ Alcance    4.5         │
│ DPS        64.6        │
│                        │
│ Objetivos  1           │
│                        │
│ [ MEJORAR ]            │
│ [ VENDER ]             │
└────────────────────────┘
```

Esto además ayuda muchísimo al balance.

---

# 18. Mejorar el feedback visual

Aquí puedes invertir bastante.

Cuando ocurre algo:

```text
CRÍTICO!
+250
SLOW!
BURN!
SHIELD BREAK!
```

Agregar:

* números de daño.
* indicadores de crítico.
* flashes.
* trails de proyectiles.
* explosiones.
* hit effects.
* telegraph de bosses.
* barra de vida más elegante.
* indicadores de rango.

Canvas puede hacer todo esto sin frameworks.

---

# 19. Música y ambientes

Ya tienes SFX.

Puedes agregar:

```text
MENU
GAMEPLAY
BOSS
VICTORY
DEFEAT
```

Y cambiar música dinámicamente:

```text
Boss HP
████████░░

Música normal
      ↓
████████
      ↓
Boss theme
```

---

# 20. Finalmente: una campaña real

Tu estructura actual permite convertir Bastionfall en algo mucho más grande:

```text
CAMPAÑA

Mundo 1
├── 1-1
├── 1-2
├── 1-3
├── 1-4
└── BOSS

Mundo 2
├── 2-1
├── 2-2
├── 2-3
├── 2-4
└── BOSS

Mundo 3
...
```

Con:

```text
⭐⭐⭐
```

Y desbloqueos:

```text
Mapa 1 → Torre
Mapa 2 → Mejora
Mapa 3 → Reliquia
Boss → Nueva mecánica
```

---

# El roadmap que yo usaría ahora

No saltaría directamente a 50 features. Haría nuevas fases así:

```text
FASE 18 — Modos
├── Campaña
├── Infinito
└── selector de modo

FASE 19 — Gameplay profundo
├── habilidades activas
├── estadísticas
├── daño flotante
└── feedback visual

FASE 20 — Enemigos avanzados
├── curador
├── regenerativo
├── invisible
├── invocador
└── élites

FASE 21 — Bosses
├── patrones
├── fases
├── habilidades
└── telegraphs

FASE 22 — Progresión
├── reliquias
├── sinergias
├── modificadores
└── builds

FASE 23 — Campaña
├── mapa mundial
├── niveles
├── estrellas
└── desbloqueos

FASE 24 — Metajuego
├── logros
├── estadísticas
├── récords
└── perfil

FASE 25 — Polish
├── audio
├── animaciones
├── UX
├── mobile
└── balance
```

### Y hay una mejora que considero especialmente importante

**No agregaría más torres todavía.**

Primero haría que las 4 actuales sean profundamente diferentes, con **ramificaciones, sinergias, estadísticas, habilidades y decisiones estratégicas**.

Es mejor tener:

> **4 torres que generan 20 estrategias**

que:

> **15 torres que hacen prácticamente lo mismo.**

Y dado que ya tienes `config/`, `systems/`, `entities/`, `render/` y `core/`, tu arquitectura actual está bastante bien posicionada para evolucionar hacia esto sin convertir `Game.js` en el clásico archivo de 4.000 líneas que un día abre VS Code y pide vacaciones. 😄

---

## Estado de implementación (Fase 3 — rebanada vertical)

Se implementó un subconjunto coherente y probado (no el documento completo, para
evitar código frágil). Archivos nuevos/modificados:

- `src/config/enemies.js`: tipos `regenerativo`, `invisible`, `curador`, `invocador` + `applyElite` con afijos.
- `src/config/towers.js`: `crit` por nivel (base para críticos/DPS).
- `src/config/abilities.js` + `src/systems/AbilitySystem.js`: 5 habilidades con CD.
- `src/config/achievements.js`: 7 logros.
- `src/systems/EnemySystem.js`: regen, aura de curación, invocación.
- `src/systems/CombatSystem.js`: críticos, daño flotante, invisible, escudo, resistencia al hielo.
- `src/systems/SpawnSystem.js`: élites por oleada; `MovementSystem` respeta escudo base.
- `src/entities/Tower.js` / `Enemy.js`: copian `crit` y campos de comportamiento.
- `Game.js`: `useAbility`, jefe cada 10 oleadas en infinito, rastreo de stats, evaluación de logros, leaderboard infinito.
- `Renderer`/`art`/`Effects`: daño flotante, rango, escudo base, indicadores de élite/escudo, feedback de habilidades.
- `Hud`/`Overlay`/`index.html`/`main.js`: barra de habilidades, panel de stats/DPS, stats de partida y logros.

## Checklist de implementación (Fase 3)

Estado vivo del documento. Cada ítem es una fase independiente que se implementa
y se marca aquí antes de pasar a la siguiente.

### Hecho
- [x] **3a — Gameplay profundo (§2/§17/§18):** estadísticas de torres visibles
      (daño/velocidad/alcance/crítico/DPS), daño flotante, críticos ×1.8, rango visible.
- [x] **3a — Habilidades activas (§3):** Rayo, Meteorito, Congelación, Bono de oro,
      Escudo de bastión, con cooldown y teclas `F/G/H/B/N`.
- [x] **3a — Enemigos avanzados (§4):** regenerativo, invisible, curador, invocador.
- [x] **3a — Élites (§5):** afijos aleatorios (Resistente, Rápido, Escudo, Brutal).
- [x] **3a — Logros (§13) y estadísticas de partida (§14):** overlay con stats + logros.
- [x] **3a — Endless mejorado (§7):** jefe cada 10 oleadas + leaderboard local.
- [x] **3b — Árbol de mejoras A/B (§2):** rama de especialización por torre (`Q`/`E`).
- [x] **3c — Sinergias entre torres (§11):** `src/config/synergies.js` + `src/systems/SynergySystem.js`;
      combinar tipos activa bonificaciones (Hielo+Fuego = "Choque térmico", Arco+Cañón = "Artillería
      coordinada", Hielo+Arco = "Puntería helada", Cañón+Fuego = "Lluvia de fuego"); barra de sinergias en HUD.
- [x] **3d — Modificadores roguelite de partida (§6):** `src/config/modifiers.js` + `src/systems/HazardSystem.js`;
      antes de empezar eliges retos (Furia enemiga +HP, Velocidad letal, Blindaje extra, Enjambre +enemigos,
      Filón de oro +oro, Sobrecalentamiento torres +velocidad, Rastro de fuego, Cristal +daño/-alcance). Panel en el
      menú (tecla `M`) con resumen de dificultad/recompensa; barra de modificadores en HUD.
- [x] **3e — Reliquias (§10):** `src/config/relics.js`; al derrotar un boss se pausa y eliges 1 de 3 reliquias
      que potencian el resto de la run y se acumulan (Núcleo de guerra, Corazón dorado, Fragmento glacial,
      Engranaje veloz, Ojo crítico, Prisma de alcance, Corazón vital, Esencia ardiente). Barra de reliquias en HUD.
- [x] **3f — Bosses con mecánicas únicas (§8):** 3 bosses con identidad propia en `enemies.js` + `BossSystem.js`:
      **Coloso** (invoca minions en fases 2/3, furia en fase 3), **Madre Enjambre** (spawnea divisores,
      deshabilita una torre temporalmente, teletransporta por el camino), **Caminante del Vacío** (se vuelve
      invisible, teletransporta y desactiva las habilidades del jugador). El boss cíclico se elige con `bossTypeFor`.
- [x] **3g — Eventos durante las oleadas (§9):** `src/config/events.js` + `src/systems/EventSystem.js`;
      desde la oleada 4 hay ~40% de probabilidad de un evento aleatorio: **Tormenta** (proyectiles -30% velocidad),
      **Lluvia de meteoros** (daño aleatorio a enemigos) y **Eclipse** (enemigos +25% velocidad). Barra de evento en HUD.
- [x] **3h — Economía más interesante (§12):** al completar oleada se suma **interés** (+5% del oro restante,
      tope 100), **racha perfecta** (sin perder vidas acumula bonus creciente, se resetea al fallar) y
      **bonus perfecto** por oleada sin fugas. Indicador de racha en HUD y resumen en el flash de oleada.
- [x] **3i — Tutorial (§15):** tutorial guiado de 4 pasos (colocar torre → iniciar oleada → mejorar →
      derrotar enemigo) con banner instructivo, botón de menú y autoarranque la primera vez (guardado en
      `Progression.tutorialDone`).
- [x] **3j — Mapas con zonas especiales (§1):** en `maps.js` (`ZONE_TYPES`, `zoneAt`) y `MovementSystem`:
      **pantano** ralentiza enemigos (×0.55), **lava** daña periódicamente, **montaña** da +30% alcance a
      torres construidas sobre ella, **bosque** da −25% alcance. Renderizadas en el mapa. Nuevo mapa "Ciénagas".
- [x] **3k — Guardado de partida a medias (§16):** `Game.saveRun()`/`continueRun()` persisten snapshot
      (mapa/modo/oleada/oro/vida/torres/modificadores/reliquias) en `Progression.data.run`; botones menú
      "Guardar partida" / "Continuar partida". El run se borra al ganar o perder. Solo se guarda entre oleadas.
- [x] **3l — Música por ambiente (§19):** `src/audio/Music.js` (sintetizada con Web Audio, sin assets):
      pistas `menu`/`gameplay`/`boss`/`victory`/`defeat` que cambian dinámicamente (a boss al aparecer un jefe,
      a gameplay al completar oleada, victory/defeat al terminar). Comparte el `AudioContext` y el mute de `Sfx`.
- [x] **3m — Campaña de mundos 1-2-3 (§20):** `campaign.js` reestructurado en 3 mundos (Llanuras/Cañones/Ciénagas)
      con 4 etapas cada uno (incluido un BOSS). `LevelSelect` agrupa por mundo y muestra estrellas, candado y
      recompensa. Al vencer una etapa, `Progression.applyStageReward` desbloquea la mejora/torre asociada y la
      siguiente etapa se habilita. Cumple "Mapa→Mejora/Torre, Boss→nueva mecánica".

### Checklist Fase 3 — COMPLETO ✅
(3a estadísticas/críticos/habilidades/enemigos/élites/logros/endless · 3b árbol A/B · 3c sinergias · 3d
modificadores · 3e reliquias · 3f bosses · 3g eventos · 3h economía · 3i tutorial · 3j zonas · 3k guardado ·
3l música · 3m campaña de mundos)

> Criterio del documento: priorizar **identidad estratégica de las 4 torres**
> (ramas, sinergias, estadísticas, habilidades) antes de añadir más torres.

### Árbol de mejoras A/B (Fase 3b — detalle)

Cada torre tiene una **rama de especialización** a elegir tras el nivel 1:

- **Arco**: `A` Francotirador (alcance + crítico) · `B` Tirador rápido (cadencia).
- **Cañón**: `A` Artillería (área masiva) · `B` Demoledor (daño directo).
- **Hielo**: `A` Criostasis (ralentización extrema) · `B` Tormenta (rango + velocidad).
- **Fuego**: `A` Piroclasto (quemadura intensa) · `B` Incendiario (proyectil rápido).

Flujo: nivel 1 (común) → elegir rama (`Q`/`E` o botones) → nivel 2 y 3 de la rama.
Archivos: `src/config/towers.js` (branches), `src/entities/Tower.js` (applyStats /
chooseBranch), `Game.chooseBranch`, `Hud.updateBranch`, teclas `Q`/`E` en `Input`.

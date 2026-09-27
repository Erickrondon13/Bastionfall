# PROMPT_OPENCODE.md

Instrucciones para que OpenCode investigue el proyecto **antes de tocar código**.

---

## Prompt sugerido para OpenCode

> Lee `PROMPT_OPENCODE.md` y `docs/FASES.md`.
>
> Estamos desarrollando **Oleada Defensa**.
>
> Por ahora **NO implementes funcionalidades**.
>
> Inspecciona todo el repositorio y analiza:
> - arquitectura
> - entry points
> - sistema de render
> - estado del juego
> - entidades
> - componentes reutilizables
> - configuración
> - assets
> - estilos
> - puntos de extensión
> - riesgos técnicos
>
> Después crea:
>
> `docs/ARCHITECTURE.md`
>
> El documento debe proponer una arquitectura escalable para implementar las
> siguientes fases sin convertir el proyecto en un monolito.
>
> No modifiques la lógica existente.
> No instales dependencias innecesarias.
> No generes código de gameplay todavía.
>
> Al terminar, muestra:
> 1. estructura encontrada
> 2. problemas detectados
> 3. arquitectura propuesta
> 4. archivos que recomienda crear
> 5. siguiente paso recomendado.

---

## Notas para el desarrollo

- El HTML actual es el **MVP 0**: todo el juego vive en un solo archivo y en un
  único `requestAnimationFrame`. Esto es intencional para el prototipo.
- Para escalar, conviene separar en módulos: `core/`, `entities/`, `systems/`,
  `config/`, `ui/`. Ver `docs/FASES.md`.
- Trabajar por fases: Fase → implementación → probar → corregir → commit → siguiente.
- Regla de oro: **primero gameplay, después arte**.

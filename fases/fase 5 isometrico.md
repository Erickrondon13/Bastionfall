Fase 1: Transición de Perspectiva y Estructura del Mapa (De Grid 2D a Isométrico)
Prompt técnico para el agente de código:

"Refactoriza el sistema de renderizado del mapa para cambiar de una cuadrícula cenital 2D a una proyección isométrica (ángulo de 30°/45°). Modifica la función de conversión de coordenadas lógicas (gridX, gridY) a coordenadas de pantalla (screenX, screenY) usando la fórmula isométrica estándar: screenX = (gridX - gridY) * (tileWidth / 2) y screenY = (gridX + gridY) * (tileHeight / 2). Reemplaza los bloques de camino planos por sprites de losetas isométricas que tengan bordes de piedra y textura de cueva."

Fase 2: Rediseño del Entorno y Ambientación (Temática de Cueva Minera)
Prompt técnico para el agente de código:

"Actualiza el fondo del juego eliminando el color verde plano y reemplazándolo por una textura de cueva oscura con patrones de roca irregular. Añade soporte para capas de profundidad (z-index) para que las paredes de la cueva aparezcan detrás de los caminos. Implementa un sistema de partículas o sprites estáticos para cristales brillantes incrustados en las paredes y añade luces puntuales con efecto de parpadeo suave ('soft pulse glow') en las zonas de antorchas y cristales."

Fase 3: Renovación de Entidades y Torres (Torres y Enemigos Estilizados)
Prompt técnico para el agente de código:

"Actualiza los componentes visuales de las torres y enemigos en el motor de juego. Sustituye los marcadores y formas geométricas básicas (como los círculos verdes de los enemigos y los iconos planos de torres) por sprites detallados con volumen y estilo de fantasía 2D/3D prerenderizado. Asegúrate de que las torres se coloquen correctamente sobre bases de piedra alineadas con la cuadrícula isométrica y añade animaciones sencillas de rotación o disparo para los proyectiles (fuego, magia y energía)."

Fase 4: Interfaz de Usuario (UI/UX) Estilo Fantasía / RPG
Prompt técnico para el agente de código:

*"Diseña e implementa la capa de interfaz de usuario (HUD) con temática de fantasía medieval y cueva.

En la barra superior, añade un fondo de panel de madera rústica con bordes metálicos, e incluye los contadores de recursos: monedas de oro con icono de moneda brillante, cristales/gemas moradas, un corazón rojo grande para la salud actual/máxima (ej. 23/25), y el indicador de oleadas (WAVES: X/Y).

En la barra inferior, crea un panel flotante central con botones circulares estilizados con bordes metálicos/piedra para los controles de pausa, reproducción, aceleración de velocidad y menú de configuración (icono de engranaje). Utiliza una tipografía clara con estilo de aventura o fantasía medieval y color dorado o blanco con sombra."*
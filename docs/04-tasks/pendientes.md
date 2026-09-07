# PROMPT PARA EL AGENTE DE DESARROLLO (MIS HOST) - V2

Eres un agente de desarrollo senior especializado en Angular 22+, CSS moderno (Tailwind v4 y custom properties) y Clean Architecture. Tu objetivo es implementar una lista de mejoras de UI, UX y persistencia en el proyecto **MIS Host**, respetando de manera estricta la arquitectura existente, el sistema de diseño zoneless y los tests unitarios.

A continuación, se detalla la estructura del sistema relevante y las instrucciones específicas para cada una de las tareas pendientes, incluyendo la nueva sección de **Páginas / Reportes Visitados Recientemente** en la página de inicio (Home).

---

## 🗺️ CONTEXTO DE LA ESTRUCTURA DEL SISTEMA

Antes de comenzar, ten en cuenta la ubicación de las capas clave del Host:
* **Preferencias e Interfaz (DDD):** `src/app/core/preferencias/` (dividido en `dominio/`, `aplicacion/` y `infraestructura/`). Todo se persiste bajo una única clave de localStorage llamada `mis.preferencias`.
* **Componentes Compartidos de UI:** `src/app/shared/ui/` (aquí viven `window-panel`, `loading-overlay`, `data-table`, `hier-selector`, etc.).
* **Módulos de Negocio / Reportes:** `src/app/pages/modules/reportes/`. Su clase base de visualización es `ReporteSimpleBase` y `ReporteBloquesBase` en `reportes/ui/reporte-simple/`.
* **Tokens de Diseño y Estilos:** `src/app/theme/tokens.css` (variables CSS `--mis-*`), preset de PrimeNG `src/app/theme/mis-theme.ts` y estilos globales en `src/assets/styles/components.css`.
* **Home / Dashboard principal:** `src/app/pages/modules/analista/items/principal/` (componente principal de bienvenida y KPIs generales).

---

## 🛠️ INSTRUCCIONES DETALLADAS POR TAREA

### Tarea 1: Tipografía más Gerencial para Reportes
* **Objetivo:** Refinar el formato de las fuentes tipográficas del sistema para darles un aspecto más limpio, profesional y ejecutivo ("estilo gerencial de reportes").
* **Ubicación técnica:** `src/app/theme/tokens.css` y `src/app/theme/mis-theme.ts`.
* **Instrucciones:**
  1. Modifica la familia de fuentes predeterminada (`font-family`) en el preset de PrimeNG o en la regla `:root` de `tokens.css` para utilizar una tipografía sans-serif altamente legible y elegante como **Inter**, **Geist Sans** o la tipografía de sistema de Apple/macOS.
  2. Asegúrate de mantener la escala tipográfica existente (de 11px a 28px) regulada en el sistema para evitar rupturas de layouts en pantallas densas.

### Tarea 2: Redondear Decimales en KPIs
* **Objetivo:** En las tarjetas de indicadores clave (KPIs), redondear los valores decimales para evitar ruido visual innecesario en cifras gerenciales.
* **Ubicación técnica:** El template HTML estándar de las tarjetas KPI definido en `05-guia-estilos-kpis-reportes.md` (normalmente implementado dentro del módulo de reportes o dashboards).
* **Instrucciones:**
  1. Localiza el componente o fragmento que renderice la clase `.kpi-card` y el valor central de la tarjeta.
  2. En el template HTML, busca la aplicación del pipe de número:
     ```html
     {{ +tarjeta.valor | number: '1.0-2' }}
     ```
  3. Modifica la configuración de formato del pipe a `'1.0-0'` para forzar el redondeo a números enteros, o haz que sea una propiedad configurable (ej. `tarjeta.formato ?? '1.0-0'`) para dar flexibilidad si algún KPI específico requiere decimales.

### Tarea 3: Colorimetría Dark Mode en Tablas
* **Objetivo:** Ajustar los contrastes y tonos de color en modo oscuro para ciertas tablas con el fin de mejorar su legibilidad y estética.
* **Ubicación técnica:** `src/app/theme/tokens.css` (bloque `.dark`) y estilos de tabla en `src/assets/styles/components.css`.
* **Instrucciones:**
  1. Identifica los componentes `<app-tabla-reporte>` (motor mixto) y `<app-tabla-dinamica>` (motor table.regular).
  2. Ajusta los tokens del modo oscuro correspondientes a las superficies y bordes de las tablas, tales como `--mis-surface`, `--mis-border` y `--mis-border-strong` bajo la clase `.dark` en `tokens.css`.
  3. **¡IMPORTANTE!** Tras realizar los cambios de color, ejecuta la batería de pruebas:
     ```bash
     node scripts/generar-tokens-paleta.mjs
     npx ng test src/app/theme/tokens.paleta.spec.ts
     ```
     Los nuevos colores deben pasar estrictamente los contrastes WCAG exigidos por las pruebas unitarias (mínimo 3:1 para bordes de control y componentes de interfaz; y 4.5:1 para textos).

### Tarea 4: Colocar al \"Puma\" en la Pantalla de Carga (Loading)
* **Objetivo:** Reemplazar el indicador de carga genérico actual por la mascota institucional (el \"Puma\") de Financiera Confianza.
* **Ubicación técnica:** `src/app/shared/ui/loading-overlay/loading-overlay.component.ts` (y su respectivo archivo HTML/CSS).
* **Instrucciones:**
  1. Asegúrate de que el recurso visual del Puma (un SVG optimizado o imagen PNG de peso mínimo) esté ubicado en la carpeta `src/assets/images/` (o agrégalo en ella).
  2. Modifica el HTML de `LoadingOverlayComponent` para retirar el spinner/círculo de carga actual de PrimeNG o CSS y renderizar en su lugar la imagen del Puma.
  3. Puedes añadir una animación CSS sutil (como un pulso suave `animate-pulse` de Tailwind o un desvanecimiento progresivo) para mantener la sensación dinámica de carga sin sobrecargar el hilo del navegador.

### Tarea 5: Retirar el Saludo de Bienvenida del Home
* **Objetivo:** Remover el saludo inicial (ej: "¡Hola, bienvenido!") que se muestra en la pantalla principal del Host para optimizar el espacio vertical.
* **Ubicación técnica:** `src/app/pages/modules/analista/items/principal/principal.component.html` (o el layout específico que contenga el saludo).
* **Instrucciones:**
  1. Ubica el elemento de texto que renderiza el saludo del usuario activo (por ejemplo, el que consulte `shell.usuarioActivo()?.nombre` para saludar).
  2. Elimina o comenta este bloque de saludo. Asegúrate de que los elementos adyacentes (filtros, KPI cards) se reacomoden correctamente hacia arriba sin dejar márgenes en blanco excesivos.

### Tarea 6: Almacenar y Mostrar los Últimos Reportes Visitados (LocalStorage & Home UI)
* **Objetivo:** Guardar en `localStorage` la lista de los últimos reportes visitados por el usuario y mostrarlos en una sección interactiva de alta fidelidad visual en el Home para facilitar el acceso rápido.
* **Ubicación técnica:** 
  * **Persistencia:** `src/app/core/preferencias/` (Dominio, Aplicación e Infraestructura) e integración en las bases de reportes en `src/app/pages/modules/reportes/ui/reporte-simple/`.
  * **UI de Inicio (Home):** `src/app/pages/modules/analista/items/principal/principal.component.{ts,html,css}`.
* **Instrucciones de Desarrollo y Diseño UX:**

  #### 💾 PARTE A: Persistencia y Modelo de Datos (Clean Architecture)
  1. **Dominio (`preferencias.model.ts`):** 
     * Extiende la interfaz `Preferencias` agregando la propiedad `recientes?: ReporteReciente[]`.
     * Define la interfaz `ReporteReciente`:
       ```typescript
       export interface ReporteReciente {
         codRep: string;
         titulo: string;
         fechaVisita: number; // Timestamp para ordenamiento
         categoria?: string;
       }
       ```
     * Actualiza la constante `PREFERENCIAS_POR_DEFECTO` y la función `sanearPreferencias(p)` para que inicialice `recientes` como un array vacío `[]` y lo hidrate de forma segura contra corrupción o cambios de versión del JSON en el localStorage (`mis.preferencias`).
  2. **Aplicación (`preferencias.service.ts`):**
     * Implementa el método `registrarReporteReciente(codRep: string, titulo: string, categoria?: string): void`.
     * La lógica interna debe:
       * Crear el nuevo objeto `ReporteReciente` con el timestamp actual.
       * Filtrar y eliminar cualquier entrada duplicada previa con el mismo `codRep`.
       * Insertar el reporte en la primera posición (`unshift`).
       * Limitar el historial a las **últimas 5 o 6 visitas**.
       * Guardar el estado reactivo actualizando el Signal de preferencias.
  3. **Integración en Reportes Base (`ReporteSimpleBase` / `ReporteBloquesBase`):**
     * Inyecta `PreferenciasService` en las bases abstractas.
     * En el ciclo de vida apropiado (cuando ya se han cargado y resuelto los metadatos del reporte, como el título y el código), invoca a:
       `this.preferenciasService.registrarReporteReciente(this.cod_rep, this.tituloReporte, this.categoriaReporte)`.

  #### 🎨 PARTE B: Diseño UX e Interfaz en el Home (`principal.component.html/.ts`)
  Para mantener la cohesión con la filosofía de diseño inspirada en macOS (minimalismo, baja contaminación visual y paneles tipo ventanas), implementa la sección de reportes recientes bajo los siguientes estándares de UX:
  1. **Layout y Estructura:**
     * Ubica la sección de **"Visitados Recientemente"** justo debajo de la fila de KPIs principales en el Home.
     * Utiliza un contenedor tipo panel (`<div class="mis-panel-recientes">`) que respete los márgenes y radios de borde definidos por los tokens `--mis-radius-lg`.
     * El título de la sección debe usar la tipografía gerencial configurada (fuente elegante, peso semibold, `--mis-text-sm` o `--mis-text-md`) acompañado de un icono sutil de "reloj" o "historial" (`pi pi-clock` de PrimeIcons).
  2. **Diseño de Tarjetas de Acceso Rápido (Cards):**
     * Renderiza los reportes recientes en un **grid responsivo** (por ejemplo, `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`).
     * **Estilo Visual:** Cada tarjeta de reporte reciente debe poseer:
       * Fondo que se adapte al tema actual utilizando el token `--mis-surface`.
       * Bordes suaves `--mis-border` y bordes interactivos sutiles en hover.
       * Un **efecto de elevación interactivo** (ej: `hover:translate-y-[-2px] hover:shadow-md transition-all duration-200 ease-out cursor-pointer`).
       * Un indicador de categoría o icono representativo en color pastel apagado según el tema, el título completo del reporte, y una etiqueta sutil de "Última visita" con formato relativo (ej: "Hace un momento", "Ayer").
  3. **Reactividad Zoneless:**
     * Expón los reportes recientes en `PrincipalComponent` mediante un **Signal computado** que consuma directamente las preferencias del servicio:
       ```typescript
       public recientes = computed(() => this.preferenciasService.preferencias().recientes ?? []);
       ```
     * El HTML debe renderizar el grid iterando sobre este Signal reactivo (`@for (reporte of recientes(); track reporte.codRep)`).
  4. **Estado Vacío (Empty State) - UX Defensivo:**
     * Si el Signal de recientes está vacío, muestra un contenedor de estado vacío con un diseño sumamente elegante:
       * Un icono de reloj de arena o carpeta vacío en color gris atenuado (`text-slate-400 dark:text-slate-600`).
       * Un texto descriptivo amigable y gerencial: *"Aún no has consultado reportes recientes. Los accesos rápidos a tus análisis más frecuentes aparecerán aquí automáticamente."*
  5. **Navegación Fluida:**
     * Al hacer click en cualquier tarjeta de reporte reciente, el sistema debe redirigir de inmediato a la ruta correspondiente del reporte utilizando el router de Angular (ej: `/modules/reportes/${reporte.codRep}`) de forma instantánea, sin parpadeos ni recargas totales de la página.

### Tarea 7: Mantener intacta la funcionalidad de Drilldown
* **Objetivo:** Asegurar que ninguna modificación estética o de color en las tablas rompa o altere el comportamiento de navegación interactiva hacia niveles inferiores (Drilldown).
* **Ubicación técnica:** Componentes `<app-tabla-reporte>` y `<app-tabla-dinamica>`, y mapeos en `utils/`.
* **Instrucciones:**
  1. No alteres bajo ningún motivo los manejadores de eventos como `(celdaClick)` o similares que emiten un `NodoConsulta` (`tip_cod`, `cod_rel`).
  2. Al modificar o re-estilizar filas y celdas (por ejemplo con `cellStyleFn` o directivas de selección), asegúrate de que los bindings de eventos sigan enlazados correctamente.
  3. Realiza pruebas manuales de navegación descendente en el selector de jerarquía organizativa (`HierSelectorComponent`) tras aplicar los cambios en las tablas.

### Tarea 8: Reemplazar Flecha \"Atrás\" por el Botón Amarillo de la Ventana macOS
* **Objetivo:** Sustituir el botón/enlace textual tradicional de \"Volver\" por una interacción integrada en el semáforo estilo macOS (reutilizando el botón amarillo).
* **Ubicación técnica:** `src/app/shared/ui/window-panel/window-panel.component.ts` (y su template HTML).
* **Instrucciones:**
  1. Revisa la definición de `<app-window-panel>`. Actualmente, implementa un semáforo de tres botones decorativos (rojo = volver al inicio/home, amarillo = explorador, verde = zoom). Además, dibuja una flecha física a la izquierda con el texto \"Volver\" cuando `conVolver` es `true`.
  2. Oculta o retira la flecha y el texto físico \"Volver\" del cuerpo de la barra del header.
  3. Reasigna la lógica de navegación de \"atrás\" (que evalúa `volverA` para hacer un `router.navigate` o invoca un `history.back()`) al **botón amarillo** del semáforo macOS.
  4. Agrega un tooltip o indicador visual sutil al posar el cursor sobre el botón amarillo para que el usuario entienda claramente que su función es retroceder a la pantalla anterior.

### Tarea 9: Mantener el Estilo y Accesibilidad en los Gráficos (Highcharts)
* **Objetivo:** Asegurar que las mejoras de diseño y temas no alteren negativamente el estilo corporativo de los gráficos y que sigan cumpliendo con las pautas de accesibilidad cromática.
* **Ubicación técnica:** `src/app/shared/ui/graficos/` y paletas de color en `src/app/theme/`.
* **Instrucciones:**
  1. Al aplicar cambios de colores o fuentes globales, no modifiques directamente la estructura de `PALETA_SERIES` ni `PALETA_TRAMOS` a menos de que sea estrictamente necesario y se conserve un Delta E adecuado para daltonismo.
  2. Asegúrate de ejecutar las pruebas de armonía de color tras cualquier alteración de paletas:
     ```bash
     npx ng test src/app/shared/ui/graficos/utils/paleta-colores.armonia.spec.ts
     ```
  3. Verifica que las etiquetas de ejes y leyendas de Highcharts se lean correctamente sobre los fondos tanto en tema claro como en modo oscuro.

---

## 🚦 FLUJO DE TRABAJO SUGERIDO

1. **Implementa de forma modular:** Realiza las modificaciones en `/src` de manera ordenada, priorizando tareas visuales simples antes de alterar el flujo de persistencia (`localStorage`).
2. **Corre los tests constantemente:**
   * Unitarios: `npx ng test --watch=false`
   * Responsive real: `npx playwright test e2e/responsive-movil.spec.ts`
3. **Mantén el enfoque \"Zoneless\" y reactivo:** Usa únicamente Signals para la gestión de estados temporales creados en tus refactorizaciones y la actualización en tiempo real de la UI de reportes recientes sin recurrir a ciclos de detección de cambios innecesarios.

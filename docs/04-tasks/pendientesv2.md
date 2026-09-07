# DOCUMENTACIÓN OFICIAL: ACTUALIZACIÓN DE DISEÑO, UX Y COMPORTAMIENTO FUNCIONAL (MIS HOST)

Este documento centraliza y detalla todas las modificaciones de diseño de interfaz (UI), experiencia de usuario (UX) y flujos lógicos acordados para el **MIS Host**. El objetivo es servir como registro técnico oficial para el equipo de desarrollo, asegurando la paridad con el sistema de diseño de Financiera Confianza y la usabilidad de estilo macOS establecida en la visión del producto [1, 4].

---

## 🗺️ RESUMEN EJECUTIVO DE LOS CAMBIOS

| # | Requerimiento | Tipo | Estado | Ficheros Clave / Ubicación |
|---|---|---|---|---|
| **1** | Tipografía más Gerencial | UI | Planificado | `src/app/theme/tokens.css` y `src/theme/mis-theme.ts` |
| **2** | Redondear Decimales en KPIs | UI/UX | Planificado | CSS de `.kpi-card` y pipe de Angular en HTML |
| **3** | Mantenimiento de Modo Oscuro en Tablas | UI | Planificado | `tokens.css` (bloque `.dark`) y `tokens.paleta.spec.ts` |
| **4** | El Puma en Pantalla de Carga (Loading) | UI/UX | Planificado | `loading-overlay.component.ts` y SVG/PNG en assets |
| **5** | Retirar Saludo de Bienvenida en Home | UX | Planificado | `principal.component.html` o layout principal |
| **6** | Historial de Últimos Reportes (Home) | UX/Funcional | Planificado | `Preferencias` en core, `ReporteSimpleBase` y Home Grid |
| **7** | Salvaguardar Funcionalidad de Drilldown | Funcional | Mandatorio | Mapeos en `utils/` de reportes y templates HTML de tablas |
| **8** | Botón Amarillo macOS para Volver Atrás | UI/UX | Planificado | `<app-window-panel>` (header de ventana estilo macOS) |
| **9** | Preservación de Estilo en Gráficos | UI/UX | Mandatorio | `PALETA_SERIES`, `PALETA_TRAMOS` y tests de accesibilidad |

---

## 📐 DISEÑO UX: ¿CÓMO IDENTIFICAR QUÉ TABLAS TIENEN DRILL-DOWN?

El **drill-down** (la capacidad de hacer clic en un dato de la tabla para navegar y profundizar en un nivel inferior de la jerarquía organizativa) no debe ser un misterio para el usuario [14]. Para garantizar una usabilidad intuitiva, ágil y limpia (sin ruido visual), se definen los siguientes **indicios y estándares UX**:

### 1. Indicador Técnico (¿Cómo lo sabe el sistema?)
* **Detección por Evento:** La tabla tiene enlazado el evento de clic de celda `(celdaClick)` o ejecuta un manejador de eventos que emite un objeto `NodoConsulta` (compuesto por `tip_cod` y `cod_rel`) [14, 22].
* **Presencia de Columnas Jerárquicas:** Si la tabla es de tipo mixto (`<app-tabla-reporte>`) o dinámica (`<app-tabla-dinamica>`), y las columnas representan niveles jerárquicos modificables (como Oficinas, Zonas, Asesores o Territorios), la celda es candidata natural para drill-down [22, 23].

### 2. Indicador Visual (¿Cómo lo sabe el usuario?)
Para evitar saturar la pantalla con textos subrayados o íconos en cada celda, se implementa una interacción sutil inspirada en macOS [4]:
* **Cursor Pointer (Mano):** Al posar el cursor sobre cualquier celda interactiva con drill-down, el cursor del mouse debe cambiar inmediatamente a `pointer`.
* **Hover de Fila o Celda:** El fondo de la fila o celda que tiene drill-down activo cambia a un tono sutil (`var(--mis-surface-hover)`) [106].
* **Estilo de Texto Interactivo (Hover-Underline sutil):** El texto de la celda interactiva se pinta en un tono acentuado (`var(--mis-primary-text)` o `--mis-text-primary`) y, **únicamente cuando el usuario pasa el mouse por encima (hover)**, se aplica un subrayado sutil (`underline`) [106, 121].
* **Indicador Visual Opcional:** En tablas complejas, el encabezado o la celda puede incluir un pequeño ícono discreto de flecha hacia abajo/derecha o un link con el color de acento del sistema [121].

---

## 🛠️ DETALLE TÉCNICO DE IMPLEMENTACIÓN Y CAMBIOS

### Tarea 1: Tipografía Gerencial para Reportes
* **Cambio:** Sustituir la familia tipográfica base del portal por una tipografía elegante, limpia y de nivel ejecutivo (como **Inter**, **Geist Sans** o la tipografía nativa de Apple).
* **Implementación:** Configurar el `font-family` global en el selector `:root` del archivo de estilos centralizado de tokens de diseño (`tokens.css`) y en el preset personalizado de PrimeNG [5].

### Tarea 2: Redondear Decimales en KPIs
* **Cambio:** Eliminar el ruido visual eliminando decimales innecesarios en las tarjetas de KPIs de alto impacto gerencial [106].
* **Implementación:** Modificar la plantilla HTML del componente que dibuja las tarjetas `.kpi-card` cambiando el pipe de Angular de `'1.0-2'` a `'1.0-0'` para redondear a números enteros de forma automática [110]:
  ```html
  {{ +tarjeta.valor | number: '1.0-0' }}
  ```
  O permitir que la propiedad del formato sea dinámica (ej: `tarjeta.formato ?? '1.0-0'`) para casos excepcionales [110].

### Tarea 3: Colorimetría en Modo Oscuro para Tablas
* **Cambio:** Ajustar los tokens de color para las tablas en modo oscuro para mejorar el contraste visual y la estética de las divisiones de datos sin saturar de bordes negros duros [4].
* **Implementación:** Modificar los tokens del bloque `.dark` en `tokens.css` para las variables `--mis-surface`, `--mis-border` y `--mis-border-strong` [10, 111].
* **Validación de Seguridad:** Es mandatorio ejecutar la batería de pruebas unitarias (`tokens.paleta.spec.ts`) para certificar que todos los nuevos colores cumplan con el ratio de contraste exigido por WCAG para interfaces (mínimo 3:1) y textos (mínimo 4.5:1) [96].

### Tarea 4: El "Puma" en la Pantalla de Carga (Loading)
* **Cambio:** Sustituir el spinner genérico o barra de progreso por la mascota institucional (El Puma de Financiera Confianza) con animación sutil.
* **Implementación:** Actualizar la plantilla HTML y el CSS del componente `LoadingOverlayComponent` [93]. Alojar la imagen PNG/SVG optimizada en `src/assets/images/` y aplicar un efecto dinámico suave como `animate-pulse` de Tailwind.

### Tarea 5: Retirar Saludo de Bienvenida del Home
* **Cambio:** Eliminar el saludo inicial (como *"¡Hola, bienvenido!"*) en la parte superior de la página principal del Host para liberar espacio de pantalla vertical en dispositivos pequeños [4].
* **Implementación:** Comentar o retirar la etiqueta de saludo que consume el nombre del usuario desde `ShellStateService` en `principal.component.html`.

### Tarea 6: Lista de Reportes Visitados Recientemente (LocalStorage y UX Home)
* **Cambio:** Almacenar de manera automatizada las últimas páginas de reportes visitadas por el usuario y presentarlas como accesos directos elegantes en el Home [155].
* **Implementación Técnica (Persistencia en Capas):**
  1. **Dominio:** En `preferencias.model.ts`, extender la interfaz `Preferencias` agregando la propiedad `recientes?: string[]` (lista de códigos de reportes) e hidratar por defecto en `sanearPreferencias()` [147, 148].
  2. **Aplicación:** Implementar en `preferencias.service.ts` el caso de uso `registrarReporteReciente(codRep: string)`. Este método debe insertar el nuevo código al inicio de la lista de `recientes`, remover duplicados y limitar la longitud del historial a un máximo de 5 o 6 reportes.
  3. **Inyección en Base:** Inyectar el servicio de preferencias en las clases abstractas `ReporteSimpleBase` y `ReporteBloquesBase` para registrar automáticamente el `cod_rep` visitado al cargar cualquier reporte [32].
* **Diseño UX en el Home:**
  * Crear un panel en forma de grid responsivo (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`) justo debajo de los KPIs de la pantalla principal [106].
  * Cada tarjeta de acceso rápido al reporte debe heredar los estilos macOS definidos en la guía: fondo `var(--mis-surface)`, bordes redondeados, sombra sutil y una transición suave al pasar el cursor (efecto de elevación vertical y brillo de borde de marca) [4, 111].
  * **UX Defensiva (Empty State):** Si el historial está vacío (por ejemplo, en un usuario de primer ingreso), se debe pintar una tarjeta con baja carga cognitiva que le invite amigablemente a explorar el menú lateral para abrir reportes, evitando dejar un hueco vacío en la pantalla.

### Tarea 7: Mantener el Drill-down Intacto
* **Cambio:** Salvaguardar la lógica de navegación jerárquica durante las mejoras visuales [14].
* **Implementación:** Mantener de forma estricta los bindings de eventos como `(celdaClick)` en `<app-tabla-reporte>` y `<app-tabla-dinamica>`, asegurándose de que la emisión del `NodoConsulta` siga su flujo reactivo sin interrupción [14, 75].

### Tarea 8: Botón Amarillo macOS para Navegación "Atrás"
* **Cambio:** Remover la flecha tradicional y el texto "Volver" del header de ventana para limpiar la barra de herramientas, delegando la navegación en el botón amarillo de la ventana macOS [4, 33].
* **Implementación:**
  1. Ocultar la flecha y etiqueta `etiquetaVolver` física del HTML de `<app-window-panel>` [33].
  2. Asignar la función de retroceso (que comprueba `volverA` para navegar a una ruta fija o ejecuta `history.back()`) al **botón amarillo** del semáforo estilo macOS (que actualmente es decorativo) [33].
  3. Añadir accesibilidad de tooltip interactivo al pasar el mouse por encima para que el usuario gerencial entienda que el botón amarillo sirve para "Retroceder a la vista anterior".

### Tarea 9: Mantener Estilos y Accesibilidad en Gráficos (Highcharts)
* **Cambio:** Garantizar que los ajustes cromáticos y tipográficos globales no degraden la visualización de los datos ni provoquen regresiones de legibilidad [98].
* **Implementación:** Respetar la paleta corporativa y asegurar que los textos de leyendas y ejes mantengan contraste visible en modo oscuro. Tras los cambios de paletas, es obligatorio ejecutar la suite de pruebas unitarias específicas para certificar la armonía perceptual y protección para daltonismo (`paleta-colores.armonia.spec.ts`) [98, 99].

---

## 🚦 FLUJO DE DESARROLLO Y GATES DE CALIDAD

Para asegurar que las modificaciones no rompan nada de lo que ya funciona perfectamente en producción, el agente de desarrollo deberá cumplir rigurosamente el siguiente flujo de calidad [68]:

1. **Desarrollo Ordenado:** Ejecutar los cambios visuales y estructurales en la rama de trabajo local.
2. **Pruebas de Accesibilidad de Color:** Después de tocar cualquier token cromático en `tokens.css`, regenerar el mapeador de paletas y correr los specs unitarios [104]:
   ```bash
   node scripts/generar-tokens-paleta.mjs
   npx ng test src/app/theme/tokens.paleta.spec.ts
   ```
3. **Pruebas de Armonía de Gráficos:** Validar el contraste de daltonismo en Highcharts [104]:
   ```bash
   npx ng test src/app/shared/ui/graficos/utils/paleta-colores.armonia.spec.ts
   ```
4. **Verificación General del Proyecto:** Garantizar que las 1783+ pruebas unitarias del Host y las pruebas de regresión se mantengan en un estado verde absoluto [115]:
   ```bash
   npx ng test --watch=false
   ```
5. **Verificación E2E de Responsividad en Dispositivos:** Validar que los cambios no introduzcan scroll horizontal en el parque real de los 13 dispositivos móviles de prueba [104, 115]:
   ```bash
   npx playwright test e2e/responsive-movil.spec.ts
   ```

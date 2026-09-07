# DOCUMENTACIÓN OFICIAL: ACTUALIZACIÓN DE DISEÑO, UX Y COMPORTAMIENTO FUNCIONAL (MIS HOST)

Este documento centraliza y detalla todas las modificaciones de diseño de interfaz (UI), experiencia de usuario (UX) y flujos lógicos acordados para el **MIS Host**. El objetivo es servir como registro técnico oficial para el equipo de desarrollo, asegurando la paridad con el sistema de diseño de Financiera Confianza y la usabilidad de estilo macOS establecida en la visión del producto [1, 4].

---

## 🗺️ RESUMEN EJECUTIVO DE LOS CAMBIOS

| # | Requerimiento | Tipo | Estado | Ficheros Clave / Ubicación |
|---|---|---|---|---|
| **1** | Tipografía más Gerencial | UI | ✅ Implementado | `src/assets/fonts/Inter-Variable-*.woff2`, `src/assets/styles/fonts.css`, `src/app/theme/tokens.css` |
| **2** | Redondear Decimales en KPIs | UI/UX | ✅ Implementado | Plantillas de los 5 reportes con montos en decimales |
| **3** | Mantenimiento de Modo Oscuro en Tablas | UI | ✅ Implementado | `src/app/theme/mis-theme.ts`, `tokens.css` (`.dark`), `tokens.paleta.spec.ts` |
| **4** | El Puma en Pantalla de Carga (Loading) | UI/UX | ✅ Implementado | `loading-overlay.component.*` + `assets/images/fc/avatars/mis_wait.png` |
| **5** | Retirar Saludo de Bienvenida en Home | UX | ✅ Implementado | `src/app/pages/modules/home/components/inicio/` |
| **6** | Historial de Últimos Reportes (Home) | UX/Funcional | ✅ Implementado | `core/preferencias/`, `core/recientes/`, `home/components/inicio/` |
| **7** | Salvaguardar Funcionalidad de Drilldown | Funcional | ✅ Verificado | `hier-selector/` y `tablas/` sin cambios respecto de `main` |
| **8** | Botón Amarillo macOS para Volver Atrás | UI/UX | ✅ Implementado | `shared/ui/window-panel/` |
| **9** | Preservación de Estilo en Gráficos | UI/UX | ✅ Verificado | `graficos/` sin cambios; `paleta-colores.armonia.spec.ts` en verde |

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

---

## 📌 CIERRE: CÓMO QUEDÓ IMPLEMENTADO

Las 9 tareas están cerradas. Donde la implementación se apartó de lo que pedía
este documento, el motivo:

### Tarea 5 · El Home no era `principal.component.html`

`/app/dashboard` carga `HOME_ROUTES` → `src/app/pages/modules/home/components/inicio/`.
Ese componente era **solo** el saludo, así que las tareas 5 y 6 se hicieron
juntas: se retiró el saludo y en su lugar quedó el historial.

**El historial es una lista, no un tablero.** Una primera versión lo pintó con
`.kpi-card` dentro de un `<app-window-panel>` y se leía como indicadores, no como
un registro de lo último visitado — y el panel tapaba el fondo de escritorio. La
versión final son **segmentos sueltos**: una línea por reporte, cada una su
propio bloque de vidrio (`--mis-glass-bg`), separadas por aire para que el
wallpaper se vea entre ellas. Sin sombra ni elevación al hover: ese gesto es el
de la tarjeta KPI. El ancho se limita a 720 px para que la fecha no se vaya al
otro extremo del monitor.

El vidrio, y no el fondo transparente, es lo que resuelve la tensión entre «que
se vea el fondo» y «que se lea el texto»: probado transparente, el rótulo quedaba
ilegible en oscuro encima del logo de la marca.

### Tarea 6 · Se guarda la ruta, y la captura es por router

- **Ruta, no `cod_rep`.** El documento proponía `recientes?: string[]` con
  códigos de reporte. Un `cod_rep` no identifica una URL del Host —el mismo
  código vive bajo rutas distintas—, así que no permite volver a la pantalla.
  Se guarda `{ ruta, titulo, fechaVisita, categoria? }`.
- **Router, no las clases base.** Inyectar preferencias en `ReporteSimpleBase` y
  `ReporteBloquesBase` obligaba a que cada una de las ~80 subclases pasara su
  `cod_rep` y su título, porque las bases no los conocen. `RecientesService`
  escucha `NavigationEnd` y cubre las 91 pantallas sin tocar ningún componente
  de reporte; los reportes nuevos quedan cubiertos sin hacer nada.

### Tarea 4 · El Puma ya existía, y el círculo no se toca

Una primera versión recortó al Puma de Kaypacha —el que levanta una copa— y sacó
el `<p-progress-spinner>`. Las dos cosas estaban mal: una copa dice «ganaste», no
«esperá», y el anillo girando es lo único que comunica que hay algo en curso; una
imagen quieta no informa nada.

La versión final usa `assets/images/fc/avatars/mis_wait.png`, el Puma
institucional de espera, dentro del anillo — **la misma composición y el mismo
archivo** que ya usan `<app-redirect-overlay>` y el spinner del login. Como ese
asset se descarga al iniciar sesión, reusarlo no suma peso. El recorte
`puma-carga.png` se borró.

### Tarea 3 · El problema no estaba solo en los tokens

Cambiar `--mis-surface`, `--mis-border` y `--mis-border-strong` no movía nada:
las tablas se pintaban con la escala `surface` de Aura, no con los tokens del
Host. Primero hubo que mapear el `datatable` del preset a las variables `--mis-*`
y recién después subir los divisores. El detalle está en **D-01** de
[`../03-auditoria/05-incidencias.md`](../03-auditoria/05-incidencias.md) y el
mapeo, documentado en
[`../02-arquitectura/03-tablas-de-reportes.md`](../02-arquitectura/03-tablas-de-reportes.md).

**Solo se tocó el bloque `.dark`.** En claro el divisor apoya sobre blanco y
nunca fue el problema; subirlo habría encuadrado toda la interfaz clara sin que
nadie lo pidiera.

### Tarea 2 · Entero salvo porcentajes y tasas

No fue un reemplazo global de `'1.0-2'` por `'1.0-0'`: se revisó tarjeta por
tarjeta. Quedaron con decimales los porcentajes, las tasas y los valores ya
escalados (÷1000 o ÷1M, donde el decimal carga la magnitud — *Gestión
Comercial*). La regla quedó en
[`../02-arquitectura/05-guia-estilos-kpis-reportes.md`](../02-arquitectura/05-guia-estilos-kpis-reportes.md).

### Tarea 8 · Se perdió «minimizar»

El botón amarillo no era decorativo: llamaba a `onMinimizar()`, que dejaba el
shell mostrando el explorador del sistema. Al darle la función de volver, esa
acción desaparece — el explorador sigue accesible desde el rail. Se eliminaron
`onMinimizar()`, el output `minimizar` y la flecha de «Volver» de la barra;
ninguna pantalla escuchaba ese output.

### Tarea 7 y 9 · Nombres del legado

`(celdaClick)` y `NodoConsulta` son nombres del STG; en el Host el drilldown son
`(nodoSeleccionado)` de `HierSelectorComponent` y `(filaSeleccionada)` de
`<app-tabla-reporte>`. Ambos archivos —y toda la carpeta `graficos/`— quedaron
**byte a byte iguales a `main`**, con sus specs en verde.

### Estado de la verificación

```
npx tsc --noEmit -p tsconfig.json     limpio
npx ng test --watch=false             1801 en verde (base: 1787)
npx playwright test                   519 en verde, 1 omitida (base: 509)
npm run build:prod                    bundle limpio
```

De paso se corrigió un defecto que venía en rojo desde el 02-09 y que no es de
este lote: la luz del semáforo de los diálogos desbordaba 2 px (**D-02** en el
historial de incidencias).

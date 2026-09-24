# Liquid Glass del Host

## Alcance implementado

La interfaz usa una capa de vidrio adaptativo para integrar el shell con el
wallpaper sin perder lectura en los temas claro y oscuro. La fuente de verdad
son los tokens `--mis-*` de `src/app/theme/tokens.css`; el preset de PrimeNG
en `src/app/theme/mis-theme.ts` y el CSS global los consumen. Ningún módulo
debe copiar sus valores RGBA, sombras o desenfoques.

La dirección visual toma como referencia las superficies translúcidas, el
contraste y las barras consistentes de [macOS](https://www.apple.com/os/macos/).
La referencia orienta el material visual; las decisiones de accesibilidad,
dominio y navegación siguen siendo propias de MIS Host.

| Área               | Implementación                                                                                                                                                                                 | Archivo responsable                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Tema y color       | Tokens de superficie, campos, diálogo, shell, estados y pares claro/oscuro. `color.util.ts` concentra conversión, composición y contraste.                                                     | `src/app/theme/tokens.css`, `src/app/theme/color.util.ts`                 |
| Botones            | `p-button` recibe geometría y severidades del preset. El brillo, la capa de vidrio de `outlined` y la respuesta de presión son globales. `.mis-btn` y `.mis-btn-ghost` cubren botones nativos. | `src/app/theme/mis-theme.ts`, `src/assets/styles/componentes/botones.css` |
| Campos             | Input, textarea, select, multiselect y tree select comparten superficie, borde, hover, foco y overlays de opciones.                                                                            | `src/assets/styles/componentes/controles.css`                             |
| Shell              | Header, menú de identidad y navegación lateral usan tokens propios para que el estado normal no parezca seleccionado.                                                                          | `pages/full-pages/layout/components/header/`, `sidebar/`                  |
| Home               | El historial de reportes es una lista compacta de accesos rápidos, con una fila completa y táctil por reporte.                                                                                 | `pages/modules/home/components/inicio/`                                   |
| Ventanas y diálogo | Ventanas de módulo y `p-dialog` usan borde, sombra y desenfoque. El velo modal es translúcido y no oscurece el tema claro.                                                                     | `componentes/ventana.css`, `componentes/dialogo.css`                      |
| KPI                | `.kpi-card` comparte el material. La variante verde `.agro-kpi` queda limitada a Cartera Agrícola diaria (Agro Mix).                                                                           | `componentes/kpi.css`, `cartera-agricola-cultivos.component.css`          |
| Incentivos         | Cuadro de Mando en paneles de vidrio, sin títulos agregados; total monetizado como cifra principal con desglose segmentado; semáforo en chips; anillos de avance y bonos Super Plus en baldosas; tablas en marco de vidrio. Solo plantillas y CSS de tokens. | `pages/modules/incentivos/components/principal/`, `ui/*`                   |

## Tokens y tema

Todo token nuevo se declara en `:root` y en `.dark` dentro de `tokens.css`, se
regenera con `npm run tokens` y se comprueba con `npm run tokens:check`. La
paleta derivada `tokens.paleta.ts` es un artefacto generado: no se edita a mano.

Los grupos actuales son:

- `--mis-glass-*`, `--mis-surface-*`: capas generales de panel y shell.
- `--mis-field-*`: fondo de campos en reposo, hover, foco y overlay.
- `--mis-header-control-*`, `--mis-sidebar-item-*`: controles compactos del
  layout, separados para que el contraste de claro no dependa del rail.
- `--mis-dialog-mask`, `--mis-dialog-bg`, `--mis-dialog-border`: velo y
  superficie de diálogo.

`color.util.ts` sustituye al anterior `contraste.util.ts`. Antes de agregar otra
utilidad se debe reutilizar `contraste()`, `componerSobre()`, `textoSobre()` y
las funciones de separación perceptual del mismo archivo. Ver la guía de
[color](./design-system.md#elegir-y-comprobar-colores).

## Tarjetas, secciones y baldosas

En claro, `--mis-glass-bg` y `--mis-glass-border` son blancos: una tarjeta de
vidrio sobre el fondo claro no se distinguía. Todo el contenido usa ahora tres
piezas que cambian solas entre temas:

| Pieza | Para qué | Tokens |
|---|---|---|
| `.mis-card` | tarjeta con ancho completo y recorte (la usan los reportes) | `--mis-card-bg`, `--mis-card-border` |
| `.mis-superficie` | tarjeta o sección sin efectos de layout; cada plantilla pone radio y padding | `--mis-card-bg`, `--mis-card-border` |
| `.mis-baldosa` | elemento dentro de una tarjeta: chip, ítem de lista, marco de tabla, franja de filtros | `--mis-tile-bg`, `--mis-tile-border` |

En claro llevan borde `--mis-border-strong` y tinte `--mis-primary-light`; en
oscuro conservan el vidrio original. `.mis-superficie` y `.mis-baldosa` viven en
`@layer base`: las utilidades de Tailwind de cada plantilla (sombra, hover,
radio) las pueden ajustar. `.kpi-card` usa el mismo `--mis-card-*`.

No armar una tarjeta con `bg-[var(--mis-surface)] border border-[var(--mis-border)]`
ni con `--mis-glass-*` sueltos: queda blanca sobre blanco en claro. Se excluyen
los elementos que flotan (menús, autocompletado, burbujas), que siguen opacos.

## Controles interactivos

Los botones y campos deben seguir estas reglas:

1. El botón principal conserva color sólido de marca. Las acciones
   secundarias usan `severity="secondary"`, también rellenas. **No se usa la
   variante `outlined`** en ningún tema: la regla de gobernanza
   `botones-sin-outlined` la rechaza. Un selector de dos vistas marca la activa
   con relleno de marca y `aria-pressed`, no alternando borde y relleno. Un
   icono sin texto necesita nombre accesible.
2. Input y select comparten `--mis-field-bg` y `--mis-border-control`. Hover
   usa `--mis-field-bg-hover`; el foco usa `--mis-field-bg-focus`, acento y
   `--mis-shadow-focus`. No reemplazar el foco por un cambio solo de color.
3. Los overlays de selección usan `--mis-field-overlay-bg`, borde de vidrio y
   sombra. Las opciones seleccionadas conservan los tokens de selección del
   tema.
4. `backdrop-filter` complementa el material. Fondo, borde y texto deben
   conservar legibilidad si el navegador no aplica desenfoque.
5. `prefers-reduced-motion` elimina la traslación y las transiciones de estos
   controles.

## Shell, navegación y breadcrumb

Los botones nativos del header usan `.header-action-button` y
`.header-profile-trigger`; no se deben dejar transparentes por defecto. El
sidebar usa fondo transparente en reposo, respuesta temporal en hover o foco y
marca persistente únicamente en `.sidebar-icon-btn--active`. Esta distinción se
conserva en desktop y móvil.

El breadcrumb de una sección remota muestra `desc_sec`. `cod_sec` y `cod_par`
son identificadores de transporte y no texto para el usuario. Cuando la URL
coincide con `act_sec`, `HeaderComponent` resuelve el rótulo desde
`MenuStgService.sistemas`; su prueba cubre el caso `L_ACTI_TASA` →
`Actividad y Tasas`.

## Home y reportes recientes

El Home presenta los reportes recientes como una lista compacta de accesos
rápidos. No ocupa el alto disponible ni usa tarjetas destacadas: cada fila es
el enlace, mide al menos 60 px y contiene icono, título, categoría y fecha
relativa. En móvil conserva la misma jerarquía y oculta solo el icono de salida
para reducir ruido visual.

El componente solo presenta el historial que entrega `PreferenciasService`.
`RecientesService` mantiene el orden y decide qué ruta final es un reporte; el
rediseño no debe registrar rutas, cambiar títulos ni introducir métricas de
negocio. El estado vacío conserva la instrucción de abrir el primer reporte
desde el menú lateral.

## Diálogos

La máscara `.p-dialog-mask.p-overlay-mask` usa `--mis-dialog-mask` con blur y
saturación. En claro el token es un velo azulado claro y en oscuro reduce la
opacidad negra; así mantiene el shell visible detrás del modal. `.p-dialog`
usa `--mis-dialog-bg`, `--mis-dialog-border`, brillo interior y desenfoque.

No asignar un fondo oscuro fijo a la máscara ni un fondo sólido al contenedor
global. Los contenidos de un diálogo pueden definir su propio padding mediante
`[contentStyle]`, como explica [Ventanas y diálogos](./ventanas-y-dialogos.md).

## KPI de Agro Mix

La tarjeta `.agro-kpi` se aplica solo en Cartera Agrícola diaria. Reasigna los
tokens de marca a verde dentro del host, sin cambiar `app-window-panel`, tablas
u otros reportes. La tarjeta conserva etiqueta, valor tabular, comparativo y
delta; el color de la tendencia acompaña el signo, pero la semántica de éxito o
peligro depende de la regla de negocio.

La reutilización global debe pasar por `.kpi-card` y por la
[guía KPI](./kpi-guidelines.md). No copiar `.agro-kpi` a otro módulo sin
validar contraste y significado de sus indicadores.

## Verificación de una modificación visual

1. Revisar claro y oscuro, con wallpaper y con fondo plano configurable.
2. Comprobar reposo, hover, selección, foco, disabled y overlays de cada
   control afectado.
3. Revisar escritorio y móvil; en el sidebar, el elemento activo debe ser el
   único persistentemente resaltado.
4. Ejecutar `npm run tokens`, `npm run verify` y
   `npx ng build --configuration production`.

Las reglas de uso de tokens, contraste y estados accesibles siguen en
[Design system](./design-system.md), [Accesibilidad](./accessibility.md) y
[Ventanas y diálogos](./ventanas-y-dialogos.md).

## Cuadro de Mando de Incentivos

El tablero (`/app/incentivos3`) agrupa su contenido en paneles `.inc-panel`
(vidrio con `--mis-glass-bg`, borde de luz y brillo especular), sin títulos
que no tenga el legado. El nivel se elige solo desde "Seleccionar nivel" en la
barra de la ventana: la tarjeta de perfil no repite ese botón. El total monetizado es la cifra principal; el estado de la
comisión es una píldora teñida con `currentColor`, así que su color lo sigue
decidiendo `claseSituacion()`.

Los helpers de color de los componentes (`claseIcono`, `claseCaja`,
`claseCelda`, `claseSituacion`) no cambiaron: son la regla de negocio y están
cubiertos por sus specs. El rediseño solo toca forma y material.

En claro, `--mis-glass-bg` y `--mis-glass-border` son blancos: un panel de
vidrio sobre el fondo claro no se distinguía. El tablero define
`--inc-panel-*` y `--inc-baldosa-*` sobre `.inc-tablero`: en claro, borde
`--mis-border-strong` y tinte `--mis-primary-light`; en oscuro, el vidrio
original. Las baldosas de los componentes hijos leen esas variables, así que
el contraste se ajusta en un solo lugar.

No usar `pAnimateOnScroll` en un contenedor de página: deja el bloque en
opacidad 0 hasta que buena parte entra en pantalla, y en un teléfono el
tablero mide más que el viewport y quedaba invisible. La entrada es una
animación CSS que respeta `prefers-reduced-motion`.

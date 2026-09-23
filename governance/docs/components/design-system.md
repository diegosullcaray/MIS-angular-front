# Design system

La fuente de verdad visual son los tokens `--mis-*` de `src/app/theme/tokens.css` y el preset de PrimeNG en `src/app/theme/mis-theme.ts`.

## Dónde vive cada cosa

| Qué | Dónde | Por qué ahí |
|---|---|---|
| Tokens `--mis-*` y preset de PrimeNG | `src/app/theme/` | son la configuración del sistema, y el preset los consume desde TypeScript |
| CSS de la interfaz | `src/assets/styles/` | reglas de presentación, agrupadas en `base/`, `componentes/` y `vendor/` |
| Estilos de un componente Angular | junto al componente (`*.component.css`) | si una clase la usa una sola pantalla, no sube a `assets/` |

`src/styles.css` importa primero los tokens y después `assets/styles/index.css`: el orden importa porque todo lo que sigue consume las variables.

En `componentes/` hay un archivo por superficie del shell —ventana, diálogo, explorador, buscador, KPI…—. Antes era un único `components.css` de 1095 líneas con 21 secciones inconexas, donde tocar una clase de la ventana obligaba a abrir el archivo entero.

Los botones se reparten entre el preset `src/app/theme/mis-theme.ts` (geometría y colores de `p-button`) y `src/assets/styles/componentes/botones.css` (material y estados visuales de `p-button` y `.mis-btn`). Los controles compactos de la barra de ventana siguen en `componentes/ventana.css`.

## Cómo se aplica el color

Tailwind v4 está configurado **sin bloque `@theme`**, así que los tokens `--mis-*` no se convierten en clases utilitarias. No existen `bg-surface-card`, `text-text-primary`, `border-border` ni ninguna clase semántica de ese estilo: escribirlas deja el elemento sin estilo.

Las dos formas válidas, ambas presentes en el código:

```html
<p class="text-[13px] text-[var(--mis-text-secondary)]">Fecha de corte</p>
<div class="rounded-xl border p-4" style="background: var(--mis-surface); border-color: var(--mis-border)">
```

Tailwind se sigue usando normalmente para todo lo que no es color: layout, espaciado, tipografía, responsive.

`PreferenciasService` reescribe estos tokens en tiempo de ejecución (tema claro/oscuro, acento, fondo). Un hex fijo se queda quieto mientras el resto de la interfaz cambia; el auditor lo marca con `--regla=tokens-de-color`.

`tokens.paleta.ts` se genera desde `tokens.css` para los tests de contraste y daltonismo: `npm run tokens` regenera, `npm run tokens:check` verifica.

### Elegir y comprobar colores

1. Elegir primero el token semántico en `tokens.css`: superficie, texto, borde o estado. Declarar los pares de claro y oscuro allí. El preset `mis-theme.ts` y los estilos de `assets/` consumen esos tokens; los componentes no deben mantener una segunda paleta de hexes.
2. Usar `theme/color.util.ts` cuando la apariencia deba calcular un color a partir de la preferencia del usuario: normalización, conversión, mezcla y texto sobre el acento. Estas funciones devuelven `null` ante entradas no válidas cuando corresponde; el consumidor debe decidir el valor de respaldo. No generar colores derivados dispersos en componentes o archivos CSS.
3. Comprobar el resultado con `contraste()` y los umbrales `CONTRASTE`: 4.5:1 para texto normal, 3:1 para texto grande y 3:1 para controles o bordes que comunican información. `textoSobre()` solo elige texto claro u oscuro según luminancia; **no demuestra** que el par alcance el contraste exigido.
4. Resolver primero cualquier capa translúcida con `componerSobre()` y el fondo opaco real. Medir los estados de reposo, hover, selección y foco en ambos temas y con los fondos configurables. Para varias series de un gráfico, comprobar además `separacionMinima()`; el color nunca debe ser la única señal de una categoría.

Las pruebas de `tokens.paleta.spec.ts` y de armonía de gráficos importan las funciones de `color.util.ts`. `aRgba()` admite hex, `rgb(...)`, `rgba(...)` con comas y `transparent`; si cambia el formato de un token, ampliar el lector y sus pruebas antes de confiar en la medición. Ejecutar `npm run tokens:check` y las pruebas de paleta tras modificar tokens.

## Dirección visual: vidrio adaptativo

La referencia para la evolución de los paneles es el [diseño de macOS 27](https://www.apple.com/os/macos/): superficies translúcidas, formas coherentes y controles legibles sobre fondos variables. Apple destaca la mejora de contraste y la posibilidad de graduar el tinte. En MIS Host esto es una **dirección de diseño**, no una afirmación de que todas las pantallas ya la implementen ni una copia de los efectos nativos de macOS.

El punto de partida existente es `.mis-window` y `.mis-page`, que usan `--mis-glass-bg`, `--mis-glass-border` y desenfoque. Las tarjetas KPI de Cartera Agrícola diaria usan una variante local con brillo y jerarquía propios; `.kpi-card` ya tiene una versión compartida de ese material. `p-card` y los demás paneles conservan su implementación actual hasta que se migren y verifiquen.

### Jerarquía de superficies

| Nivel | Uso | Tratamiento buscado |
|---|---|---|
| Ventana de módulo | Marco y barra de `app-window-panel` | Vidrio de intensidad moderada; borde y sombra separan la ventana del wallpaper. Barra y cuerpo pertenecen a la misma ventana. |
| Tarjeta resumen | KPI y bloques de lectura breve | Un grado más de relieve, esquina amplia y reflejo sutil. La cifra y su contexto tienen prioridad sobre el efecto. |
| Datos densos | Tablas, gráficos, formularios largos | Superficie estable y suficientemente opaca para leer números, ejes y controles. El vidrio queda en el contenedor, no detrás de cada celda. |
| Diálogo | Decisión o tarea sobre la ventana | Superficie elevada y máscara clara; conserva el foco, el cromo y la salida por teclado. |

### Reglas para nuevas superficies o migraciones

1. Usar tokens `--mis-*` para fondo, tinte, borde, sombra y texto. Una variante local vive junto al componente; un patrón compartido se incorpora a `src/assets/styles/componentes/` y a `tokens.css` cuando más de una pantalla lo necesita.
2. La translucidez no debe hacer depender el contraste del wallpaper. Poner una capa de superficie bajo el contenido; comprobar texto, cifras, iconos y bordes en claro, oscuro y con cada fondo configurable. El brillo es decorativo y no comunica estado.
3. Mantener pocas capas de vidrio: ventana y, si ayuda a la jerarquía, tarjeta resumen. Las tablas y los controles de datos usan fondos estables. Evitar desenfoques anidados sobre cada fila o gráfico.
4. Conservar la lectura sin `backdrop-filter`: la capa de fondo debe funcionar por sí sola si el navegador no aplica el desenfoque. No depender solo de transparencia para delimitar una acción.
5. Ajustar radios, espaciado y sombras como sistema. El panel, sus tarjetas y sus diálogos deben verse relacionados sin tener el mismo relieve. Respetar foco visible y movimiento reducido.

Antes de extender la variante de Agro Mix a otros módulos, comparar capturas reales en escritorio y móvil, en claro y oscuro, con el wallpaper y con fondo plano. Registrar contraste y coste de renderizado cuando haya varias superficies con desenfoque. Las [guías KPI](./kpi-guidelines.md) y [ventanas y diálogos](./ventanas-y-dialogos.md) precisan cada superficie.

### Botones y controles

Siguiendo la [guía de botones de Apple](https://developer.apple.com/design/human-interface-guidelines/buttons), el botón principal conserva un fondo sólido de marca, con brillo leve y forma de cápsula. El secundario usa una superficie neutra con borde visible; `outlined` recibe una capa translúcida, mientras `text` permanece discreto. La variante `.mis-btn-ghost` aplica el mismo material a los botones nativos del Host. La paleta semántica de éxito, aviso y peligro sigue expresando la acción, no la decoración.

Reservar el color de marca para una o dos acciones principales por vista. Todos los botones deben tener estado de presión, foco visible, etiqueta accesible si solo muestran un icono y un área de activación adecuada al contexto. Los botones compactos de la barra mantienen su función y su posición. El fondo y el texto deben seguir siendo legibles sin desenfoque y en ambos temas.

Los campos de PrimeNG se definen en `formField` del preset y se materializan en `componentes/controles.css`. Usan la familia `--mis-field-*` para reposo, hover, foco y overlays. La [guía Liquid Glass](./liquid-glass.md) enumera el alcance implementado y los pasos de verificación.

## Reglas

- Tokens semánticos, nunca colores fijos, para superficies, texto, bordes y estados.
- Mantener separados los contratos de tabla: `app-tabla-reporte` y `app-tabla-dinamica` no son intercambiables.
- Los componentes compartidos no dependen de un módulo de negocio.
- Todo componente interactivo conserva accesibilidad y los estados de carga, vacío y error.
- El error se evalúa antes que el vacío: una consulta fallida no es "sin datos".

## Superficies con cromo propio

La ventana de módulo y los diálogos comparten barra de título y semáforo, definidos en `componentes/ventana.css` y `componentes/dialogo.css`. El contrato completo —incluidas tres trampas de PrimeNG que ya costaron tiempo— está en [ventanas y diálogos](./ventanas-y-dialogos.md).

## Catálogo

- [Component catalog](./component-catalog.md)
- [Ventanas y diálogos](./ventanas-y-dialogos.md)
- [Recorridos guiados](./tours-guiados.md)
- [Accessibility and UI states](./accessibility.md)
- [KPI guidelines](./kpi-guidelines.md)
- [Storybook](./README.md)
- [Global state](../development/state-model.md)
- Guía operativa: [`skills/mis-component-styling`](../../skills/mis-component-styling/SKILL.md)

Cada familia de `src/app/shared/ui/` tiene además su propio `README.md` junto al código, con el contrato del componente.

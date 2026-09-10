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

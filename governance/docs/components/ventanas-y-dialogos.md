# Ventanas y diálogos

Toda superficie que se abre encima del contenido —el panel de un módulo y cualquier `p-dialog`— usa el mismo cromo: barra de título clara, semáforo a la izquierda y título centrado. No es decoración: es lo que hace que el usuario reconozca "esto es una ventana" sin leer nada.

## Las dos superficies

| Superficie | Quién la pinta | Estilos |
|---|---|---|
| Panel de módulo | `app-window-panel` (`src/app/shared/ui/window-panel/`) | `src/assets/styles/componentes/ventana.css` |
| Diálogo | `p-dialog` de PrimeNG, con tema global | `src/assets/styles/componentes/dialogo.css` |

Las clases `.mis-window-*` viven en `assets/styles/`, no en el CSS del componente, porque las acciones que cada módulo proyecta en la barra (`[ventana-acciones]`) pertenecen al scope de la plantilla que las escribe.

## Evolución visual del panel

La [dirección de vidrio adaptativo](./design-system.md#dirección-visual-vidrio-adaptativo) toma de [macOS 27](https://www.apple.com/os/macos/) el énfasis en contraste, barras uniformes y formas de ventana coherentes. El panel actual ya tiene fondo translúcido, `backdrop-filter`, borde y sombra en `.mis-window`; su barra usa `--mis-window-bar-bg`. Los botones compactos `.mis-window-btn` ya tienen forma de cápsula y una capa translúcida. Las siguientes son mejoras propuestas para una migración del resto del componente compartido, no comportamiento ya implementado:

| Prioridad | Mejora del panel | Comprobación |
|---|---|---|
| 1 | Graduar el tinte de barra y cuerpo como una sola ventana. Las variantes de marca, como el verde de Agro Mix, no deben convertir la barra en un bloque opaco que rompa la continuidad del material. | Título, subtítulo, iconos y semáforo legibles en claro y oscuro sobre foto y fondo plano. |
| 2 | Ordenar la profundidad: ventana elevada, tarjetas resumen un nivel dentro y tabla sobre una superficie estable. | Los bordes y sombras separan niveles sin sumar halos o desenfoques en cada celda. |
| 3 | Afinar radios y espaciado entre barra, cuerpo, filtros y tarjetas, conservando el título centrado y las acciones actuales. | Escritorio y móvil sin recortes, desplazamiento horizontal ni pérdida de controles. |
| 4 | Evaluar un ajuste de tinte en preferencias solo después de definir tokens y sus extremos de contraste; debe aplicarse al shell completo. | Los dos extremos mantienen lectura y foco visible; el fondo opaco funciona sin desenfoque. |

Esta evolución no cambia los contratos de navegación del semáforo ni el comportamiento de `p-dialog`. Cualquier modificación global de `ventana.css`, `dialogo.css` o tokens requiere revisión visual de los módulos que comparten estas superficies.

## El semáforo

Tres luces de 12 px, en el orden de macOS. El glifo de cada una aparece al pasar el mouse por el grupo, no por la luz.

| Luz | Clase | Glifo | Qué hace |
|---|---|---|---|
| Roja | `.mis-window-light--cerrar` | `✕` | cierra y vuelve al inicio del shell |
| Amarilla | `.mis-window-light--volver` | `‹` | navega hacia atrás |
| Verde | `.mis-window-light--zoom` | `⤢` | pantalla completa |
| Apagada | `.mis-window-light--apagada` | — | la ventana no ofrece ese control |

La amarilla se llamó `--minimizar` hasta que su función pasó a ser "volver". Un diálogo que quedó con el nombre viejo se veía con un botón gris del sistema y sin glifo: ver [INC-2026-09-09-01](../evidence/quality/incidents.md).

## El cromo del diálogo

El tema global de `p-dialog` convierte la cabecera de PrimeNG en una barra de ventana:

- La cabecera pasa a `grid` de tres columnas, para que el título quede ópticamente centrado aunque el semáforo ocupe la izquierda.
- El botón de cerrar de PrimeNG se repinta como luz roja; las luces que el diálogo no ofrece se dibujan apagadas con pseudo-elementos.
- El cuerpo va sobre `--mis-dialog-bg`, con borde de `--mis-dialog-border`, brillo interior y desenfoque. La máscara usa `--mis-dialog-mask`: en claro es un velo azulado translúcido y en oscuro baja la opacidad para conservar el shell visible. El pie alinea sus botones a la derecha.

**Sin `!important`.** PrimeNG emite su tema dentro de `@layer primeng` (lo configura `providePrimeNG` en `src/app/app.config.ts`) y este archivo va sin capa, así que ya gana la cascada. Como efecto secundario buscado, `[contentStyle]` —que es estilo en línea— vuelve a mandar sobre el padding del cuerpo.

### Un diálogo con pasos internos

PrimeNG no deja inyectar nada en su grupo de acciones, así que un diálogo que necesita una luz **que haga algo** proyecta su propio semáforo:

```html
<ng-template pTemplate="header" let-ariaLabelledBy="ariaLabelledBy">
  <div class="mis-window-lights mis-dialog-lights" role="group" aria-label="Controles del diálogo">
    <button class="mis-window-light mis-window-light--cerrar" data-glifo="✕" (click)="cerrar()"></button>
    <button class="mis-window-light mis-window-light--volver" data-glifo="‹" (click)="volverAlMenu()"></button>
    <span class="mis-window-light mis-window-light--apagada" aria-hidden="true"></span>
  </div>
  <span [id]="ariaLabelledBy" class="p-dialog-title">Selecciona Nivel</span>
</ng-template>
```

Cuando existe `.mis-dialog-lights`, el semáforo automático se apaga. El botón de PrimeNG se **oculta**, no se desactiva: `closable` sigue en `true`, que es lo que la librería mira para que Escape siga cerrando el diálogo.

Ejemplo vivo: `src/app/pages/modules/incentivos/ui/selector-nivel-dialog/`.

### Cambio de perfil

El menú de identidad del shell (`src/app/pages/full-pages/layout/components/header/`) ofrece la acción **Cambiar perfil** cuando existen alternos autorizados. La acción abre un `p-dialog` modal; no cambia de usuario directamente desde una fila del menú.

El diálogo lista nombre y cargo, mantiene una única selección temporal y exige confirmación. La identidad original también aparece cuando se está usando un alterno, para permitir volver sin una ruta adicional. Cancelar, Escape y clic fuera cierran sin mutar `AuthService`. El spec vecino del header cubre apertura, confirmación, error y retorno a la identidad original.

## Tres trampas de PrimeNG que ya costaron tiempo

1. **Los `pTemplate` se resuelven una sola vez**, en `onAfterContentInit`. Un pie envuelto en `@if` nunca se registra: el diálogo se queda sin pie para siempre. Se declara siempre y se esconde con la clase `mis-dialog--sin-pie` cuando ese paso no lo necesita.
2. **`closeOnEscape` depende de `closable`.** Poner `closable` en `false` para dibujar un semáforo propio deja el diálogo sin salida por teclado.
3. **`:host ::ng-deep` no alcanza a un diálogo con `appendTo="body"`**: el contenido no cuelga del host, así que la regla nunca aplica. Lo que es del cromo va al CSS global; lo que es de una pantalla, a `styleClass` + una regla global con esa clase.

## Reglas

- Un diálogo nuevo no define su propia cabecera de color: hereda el cromo. Si necesita una luz activa, usa `.mis-dialog-lights`.
- El semáforo es navegación real. Una luz que no hace nada va apagada, nunca de color.
- Los colores del cromo salen de tokens (`--mis-window-bar-bg`, `--mis-window-light-apagada`, `--mis-dialog-mask`, `--mis-dialog-bg`, `--mis-dialog-border`), así que el diálogo acompaña el tema claro y oscuro sin tocar nada.
- El ancho se declara en `[style]`; cuando depende del paso que se muestra, se calcula con un `computed`.

## Ver también

- [Catálogo de componentes](./component-catalog.md) · [Design system](./design-system.md)
- [Liquid Glass del Host](./liquid-glass.md)
- Guía operativa: [`skills/mis-ventanas-dialogos`](../../skills/mis-ventanas-dialogos/SKILL.md)
- [Recorridos guiados](./tours-guiados.md), que resaltan estas superficies

import { Component, input } from '@angular/core';

/**
 * Baldosa de vidrio (`.mis-baldosa`) que agrupa los filtros propios de un reporte, con el mismo
 * material, padding y disposición que la de `app-hier-selector`. Así la franja de filtros se lee
 * como tarjetas hermanas en vez de controles sueltos al lado de la tarjeta de jerarquía.
 */
@Component({
  selector: 'app-grupo-filtros',
  standalone: true,
  host: {
    // `empty:hidden`: en los armazones con slot de filtros opcional, si el reporte no proyecta
    // ninguno no queda una baldosa vacía (los comentarios de `@if` no cuentan para `:empty`).
    class:
      'w-full flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-2.5 sm:gap-3 p-2.5 sm:p-2 mis-baldosa rounded-xl shadow-xs empty:hidden',
    '[class.sm:w-fit]': '!anchoCompleto()',
    '[class.sm:w-full]': 'anchoCompleto()',
  },
  template: '<ng-content />',
})
export class GrupoFiltrosComponent {
  /** `true` (default), igual que `app-hier-selector`: ocupa todo el ancho; `false` la ajusta al contenido. */
  readonly anchoCompleto = input(true);
}

import { Component, input, model, viewChild } from '@angular/core';
import { Popover } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { SelectFiltroComponent } from '../select-filtro/select-filtro.component';
import type { OpcionFiltro } from '../opcion-filtro.model';

/**
 * Botón de calendario para la barra del panel (`[ventana-acciones]`), al costado del de filtros:
 * abre un popover con el selector de fecha de cierre en vez de ocuparle una fila a los filtros del
 * cuerpo. Reemplaza al `app-select-filtro` de "Fecha Cierre" en escritorio; en pantallas angostas
 * ese selector sigue en el cuerpo (dentro de "Filtros") y este botón no se muestra.
 *
 * La visibilidad va en el host y no en el `<button>`: `.mis-window-btn` (en `ventana.css`, fuera de
 * las capas de Tailwind) fija `display: inline-flex` y le ganaba a `hidden`, así que en móvil el
 * botón aparecía también en la barra, duplicando el filtro.
 */
@Component({
  selector: 'app-fecha-cierre-boton',
  standalone: true,
  imports: [SelectFiltroComponent, Popover, TooltipModule],
  host: { class: 'hidden lg:contents' },
  template: `
    <button
      type="button"
      class="mis-window-btn"
      (click)="popover.toggle($event)"
      [attr.aria-label]="etiqueta()"
      [pTooltip]="etiqueta()"
      tooltipPosition="bottom"
    >
      <i class="pi pi-calendar text-[14px]"></i>
    </button>
    <p-popover #pop>
      <app-select-filtro [etiqueta]="etiqueta()" [opciones]="opciones()" [(valor)]="valor" ancho="w-48" />
    </p-popover>
  `,
})
export class FechaCierreBotonComponent<T extends string | number> {
  readonly etiqueta = input('Fecha Cierre');
  readonly opciones = input.required<OpcionFiltro<T>[]>();
  readonly valor = model.required<T>();

  private readonly popoverRef = viewChild.required<Popover>('pop');
  protected get popover(): Popover {
    return this.popoverRef();
  }
}

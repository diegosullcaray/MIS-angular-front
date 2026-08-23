import { Component, input, output } from '@angular/core';
import { HierSelectorComponent } from '../hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../models/tabla-reporte.model';

/**
 * Armazón de un reporte de un solo bloque: ventana + selector de jerarquía +
 * tabla, que es la forma del `report-cra-v1p1` del legado.
 *
 * Los filtros propios del reporte se proyectan en `[filtros]` (debajo del
 * selector, como en el legado) y la leyenda al pie en `[nota]`.
 */
@Component({
  selector: 'app-reporte-simple',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, WindowPanelComponent],
  template: `
    <app-window-panel [titulo]="titulo()" [subtitulo]="subtitulo()" [permitirActualizar]="false" [conFiltros]="true">
      <div ventana-filtros class="flex flex-col gap-3">
        <app-hier-selector
          [paramsHier]="paramsHier()"
          [placeholder]="placeholder()"
          (nodoSeleccionado)="nivelSeleccionado.emit($event)"
          (error)="errorJerarquia.emit()"
        />
        <ng-content select="[filtros]" />
      </div>

      @if (!nivel()) {
        <app-empty-state [titulo]="tituloVacio()" [descripcion]="descripcionVacio()" />
      } @else {
        <div class="mis-card p-3 overflow-x-auto">
          <app-tabla-reporte [encabezados]="tabla().headers" [filas]="tabla().body" [cargando]="cargando()" />
        </div>
        <ng-content select="[nota]" />
      }
    </app-window-panel>
  `,
})
export class ReporteSimpleComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly paramsHier = input.required<ParamsJerarquia>();
  readonly placeholder = input('Elegir nivel');

  /** Nodo elegido; mientras sea `null` se muestra el estado vacío en vez de la tabla. */
  readonly nivel = input.required<HierarquiaNodo | null>();
  readonly tabla = input.required<TablaReporteResultado>();
  readonly cargando = input(false);

  readonly tituloVacio = input('Elige un nivel');
  readonly descripcionVacio = input('Selecciona un nivel de la jerarquía en los filtros de arriba para ver el reporte.');

  readonly nivelSeleccionado = output<HierarquiaNodo>();
  readonly errorJerarquia = output<void>();
}

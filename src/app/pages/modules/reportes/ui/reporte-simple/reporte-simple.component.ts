import { Component, computed, input, output } from '@angular/core';
import { HierSelectorComponent } from '../hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../models/tabla-reporte.model';

/** Un bloque del reporte: su tabla y, si el legado se lo pone, su título. */
export interface BloqueReporte {
  titulo?: string;
  tabla: TablaReporteResultado;
}

/**
 * Armazón de un reporte del `report-cra-v1p1` del legado: ventana + selector de
 * jerarquía + sus bloques de tabla, uno debajo del otro como los apila el legado.
 *
 * Para un solo bloque alcanza con `[tabla]`; para varios, `[bloques]`.
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
        <div class="flex flex-col gap-5">
          @for (bloque of lista(); track $index) {
            <section class="flex flex-col gap-2">
              @if (bloque.titulo) {
                <h2 class="text-[13px] font-semibold text-[var(--mis-text-primary)] m-0">{{ bloque.titulo }}</h2>
              }
              <div class="mis-card p-3 overflow-x-auto">
                <app-tabla-reporte [encabezados]="bloque.tabla.headers" [filas]="bloque.tabla.body" [cargando]="cargando()" />
              </div>
            </section>
          }
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
  /** Reporte de un solo bloque. Para varios, usar `bloques`. */
  readonly tabla = input<TablaReporteResultado>();
  /** Bloques del reporte, en el orden en que los apila el legado. */
  readonly bloques = input<BloqueReporte[]>();
  readonly cargando = input(false);

  protected readonly lista = computed<BloqueReporte[]>(() => {
    const varios = this.bloques();
    if (varios) return varios;
    const una = this.tabla();
    return una ? [{ tabla: una }] : [];
  });

  readonly tituloVacio = input('Elige un nivel');
  readonly descripcionVacio = input('Selecciona un nivel de la jerarquía en los filtros de arriba para ver el reporte.');

  readonly nivelSeleccionado = output<HierarquiaNodo>();
  readonly errorJerarquia = output<void>();
}

import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { ListSkeletonComponent } from '../../../../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_SEGUROS_PASIVOS, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { BloqueGrafico } from '../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import { SegurosService } from '../../services/seguros.service';

/**
 * "Evolutivo Pasivos"
 * (`repositorio/actividad-diaria/seg-pasivos-graf/seguro-pasivos-grafico`) —
 * legado `repositorio/seguro-pasivos-graf` (`GRAFSEGPAS_01` y `_02`).
 *
 * Ver `SegurosService.evolutivoPasivos()`: estos bloques traen las series
 * serializadas y el legado las resolvía con `eval()`. Acá se parsean como JSON;
 * si el payload no lo es, el gráfico no se pinta en vez de mostrar datos malos.
 */
@Component({
  selector: 'app-evolutivo-pasivos',
  standalone: true,
  imports: [HierSelectorComponent, GraficoMixtoComponent, EmptyStateComponent, ListSkeletonComponent, WindowPanelComponent],
  templateUrl: './evolutivo-pasivos.component.html',
  styleUrl: './evolutivo-pasivos.component.css',
})
export class EvolutivoPasivosComponent {
  private readonly servicio = inject(SegurosService);
  private readonly toast = inject(ToastService);

  /**
   * OJO: este reporte NO usa `UNI_1`. El legado pide su jerarquía directo con
   * `iniHierarchy(14, 4)` — otra jerarquía y otra profundidad que el resto de
   * Seguros, que van con `(9, 6)`.
   */
  protected readonly paramsHier = PARAMS_HIER_SEGUROS_PASIVOS;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly graficos = signal<BloqueGrafico[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      if (nodo) this.cargar(nodo);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo): void {
    this.cargando.set(true);
    this.servicio.evolutivoPasivos({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (graficos) => {
        this.graficos.set(graficos);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

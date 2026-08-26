import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { GraficoMixtoComponent } from '../../../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { EmptyStateComponent } from '../../../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { ListSkeletonComponent } from '../../../../../../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { WindowPanelComponent } from '../../../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../../../models/jerarquia.model';
import type { BloqueGrafico } from '../../../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';

/**
 * "Dashboard" de Cero Cuotas Nuevas (`leg/com/rda/adm/graf-dashboard`) — legado
 * `rda/administracion/mora/Dashboard_rda`.
 *
 * Es el único del nodo que no devuelve tablas: su entrada de `cra-map.ts`
 * declara `graphic` en vez de `table`, así que se pide por `graphicData` y se
 * pinta con `<app-grafico-mixto>`. Un mismo bloque puede traer varios gráficos.
 */
@Component({
  selector: 'app-cero-cuotas-dashboard',
  standalone: true,
  imports: [HierSelectorComponent, GraficoMixtoComponent, EmptyStateComponent, ListSkeletonComponent, WindowPanelComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class CeroCuotasDashboardComponent {
  private readonly servicio = inject(CeroCuotasNuevasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

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
    this.servicio.dashboard({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
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

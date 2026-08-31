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
 * "Dashboard en Revisión" de Cero Cuotas Nuevas
 * (`repositorio/actividad-diaria/mora/cero-cuotas`) — legado
 * `repositorio/cero-cuotas`, bloques `REP_CERCUOT_01` y `_02`.
 *
 * Son los cuatro gráficos de cero cuotas del legado: evolución en número y en
 * S/MM, y su apertura por tramos de atraso.
 *
 * PENDIENTE: el legado monta además, en el mismo archivo, la cabecera "Avance
 * Comercial / Banca Individual" (cuatro KPI con meta y avance) y dos mapas de
 * calor, que salen de los strands `RS_GEST_COM_*` / `GRAF_GEST_COM_*` — los
 * mismos de "Gestión Comercial" — con un cálculo de metas propio. Esa parte
 * queda fuera de esta migración a propósito: no se puede reproducir sin
 * confirmar de dónde sale cada meta, y ponerle números inventados a un tablero
 * de banca es peor que no mostrarlos.
 */
@Component({
  selector: 'app-cero-cuotas-dashboard-revision',
  standalone: true,
  imports: [HierSelectorComponent, GraficoMixtoComponent, EmptyStateComponent, ListSkeletonComponent, WindowPanelComponent],
  templateUrl: './dashboard-revision.component.html',
})
export class CeroCuotasDashboardRevisionComponent {
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
    this.servicio.dashboardRevision({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
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

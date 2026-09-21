import { Component, effect, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
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
import { TablaDinamicaComponent } from '../../../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../../../models/tabla-dinamica.model';
import type { MapaCalorCeroCuotas } from '../../../../utils/cero-cuotas-mapeo.util';
import { MapaCalorCeroCuotasComponent } from './mapa-calor-cero-cuotas.component';

/**
 * Dashboard en Revisión de Cero Cuotas Nuevas — legado `repositorio/cero-cuotas`.
 *
 * Los cuatro gráficos del legado: evolución en número y en S/MM, y su apertura
 * por tramos de atraso.
 *
 * Incluye el Top 10 navegable y los dos mapas de calor que agregó el último
 * commit STG. Las KPI de Avance Comercial siguen fuera porque pertenecen a
 * otro cálculo de metas y no forman parte de este contrato.
 */
@Component({
  selector: 'app-cero-cuotas-dashboard-revision',
  standalone: true,
  imports: [HierSelectorComponent, GraficoMixtoComponent, EmptyStateComponent, ListSkeletonComponent, WindowPanelComponent, TablaDinamicaComponent, MapaCalorCeroCuotasComponent],
  templateUrl: './dashboard-revision.component.html',
})
export class CeroCuotasDashboardRevisionComponent {
  private readonly servicio = inject(CeroCuotasNuevasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly graficos = signal<BloqueGrafico[]>([]);
  protected readonly topAsesores = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly mapasCalor = signal<MapaCalorCeroCuotas[]>([]);
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
    const consulta = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel };
    forkJoin({
      graficos: this.servicio.dashboardRevision(consulta),
      topAsesores: this.servicio.topAsesoresDashboardRevision(consulta),
      mapasCalor: this.servicio.mapasCalorDashboardRevision(consulta),
    }).subscribe({
      next: ({ graficos, topAsesores, mapasCalor }) => {
        this.graficos.set(graficos);
        this.topAsesores.set(topAsesores);
        this.mapasCalor.set(mapasCalor);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  /** El clic en Descripción conserva el drill-down jerárquico del `ddHier` STG. */
  protected onTopAsesorSeleccionado({ clave, fila }: { clave: string; fila: Record<string, unknown> }): void {
    if (clave !== 'descripcion') return;
    const tipCod = Number(fila['htipcod']);
    const codRel = String(fila['hcodrel'] ?? '');
    if (!Number.isFinite(tipCod) || !codRel) return;
    this.nivelActual.set({ tip_cod: tipCod, cod_rel: codRel, des_rel: String(fila['descripcion'] ?? '') });
  }
}

import { Component, effect, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HierSelectorComponent } from '../../../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { GraficoMixtoComponent } from '../../../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { EmptyStateComponent } from '../../../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { ListSkeletonComponent } from '../../../../../../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { WindowPanelComponent } from '../../../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { TablaDinamicaComponent } from '../../../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { GraficoMapaCalorComponent } from '../../../../../../../../../../../shared/ui/graficos/grafico-mapa-calor/grafico-mapa-calor.component';
import { ToastService } from '../../../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../../../utils/hier-selector-error.util';
import {
  PARAMS_HIER_UNIDAD,
  type HierarquiaNodo,
} from '../../../../../../../../models/jerarquia.model';
import {
  TABLA_DINAMICA_VACIA,
  type TablaDinamicaResultado,
} from '../../../../../../../../models/tabla-dinamica.model';
import type {
  BloqueGrafico,
  MapaCalorGrafico,
} from '../../../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';
import type { KpiCeroCuotas } from '../../../../models/cartera-en-mora.model';

/**
 * Dashboard de `repositorio/actividad-diaria/mora/cero-cuotas`.
 *
 * Replica el dashboard legacy usando los recursos nativos del nuevo Reportes:
 * selector jerárquico, tabla dinámica con drill-down, mapas de calor y gráficos.
 */
@Component({
  selector: 'app-cero-cuotas-dashboard-revision',
  standalone: true,
  imports: [
    HierSelectorComponent,
    GraficoMixtoComponent,
    EmptyStateComponent,
    ListSkeletonComponent,
    WindowPanelComponent,
    TablaDinamicaComponent,
    GraficoMapaCalorComponent,
  ],
  templateUrl: './dashboard-revision.component.html',
})
export class CeroCuotasDashboardRevisionComponent {
  private readonly servicio = inject(CeroCuotasNuevasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly graficos = signal<BloqueGrafico[]>([]);
  protected readonly kpis = signal<KpiCeroCuotas[]>([]);
  protected readonly topAsesores = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly mapasCalor = signal<MapaCalorGrafico[]>([]);
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

  /** Conserva el drill-down del Top 10 cuando el backend entrega el nodo destino. */
  protected onTopAsesorSeleccionado({
    clave,
    fila,
  }: {
    clave: string;
    fila: Record<string, unknown>;
  }): void {
    if (clave !== 'descripcion') return;
    const tipCod = Number(fila['htipcod']);
    const codRel = String(fila['hcodrel'] ?? '');
    if (!Number.isFinite(tipCod) || !codRel) return;
    this.nivelActual.set({
      tip_cod: tipCod,
      cod_rel: codRel,
      des_rel: String(fila['descripcion'] ?? ''),
    });
  }

  protected millones(valor: number): string {
    return (valor / 1_000_000).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  protected claseVariacion(kpi: KpiCeroCuotas): string {
    const favorable = kpi.favorableCuandoBaja ? kpi.variacion < 0 : kpi.variacion >= 0;
    return favorable ? 'text-emerald-600' : 'text-red-600';
  }

  private cargar(nodo: HierarquiaNodo): void {
    this.cargando.set(true);
    const consulta = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel };
    forkJoin({
      graficos: this.servicio.dashboardRevision(consulta),
      kpis: this.servicio.kpisDashboardRevision(consulta),
      topAsesores: this.servicio.topAsesoresDashboardRevision(consulta),
      mapasCalor: this.servicio.mapasCalorDashboardRevision(consulta),
    }).subscribe({
      next: ({ graficos, kpis, topAsesores, mapasCalor }) => {
        this.graficos.set(graficos);
        this.kpis.set(kpis);
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
}

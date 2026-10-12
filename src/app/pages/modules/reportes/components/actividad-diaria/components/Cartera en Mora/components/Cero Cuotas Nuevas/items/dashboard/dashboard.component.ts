import { Component, effect, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import { HierSelectorComponent } from '../../../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { GraficoMixtoComponent } from '../../../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { EmptyStateComponent } from '../../../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { EsqueletoGraficoComponent } from '../../../../../../../../../../../shared/ui/graficos/esqueleto-grafico/esqueleto-grafico.component';
import { WindowPanelComponent } from '../../../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../../../models/jerarquia.model';
import type { BloqueGrafico } from '../../../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import { SelectFiltroComponent } from '../../../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { GrupoFiltrosComponent } from '../../../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';
import { FechaCierreBotonComponent } from '../../../../../../../../../../../shared/ui/formularios/fecha-cierre-boton/fecha-cierre-boton.component';
import type { OpcionFiltro } from '../../../../../../../../../../../shared/ui/formularios/opcion-filtro.model';
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
  imports: [HierSelectorComponent, GraficoMixtoComponent, EmptyStateComponent, EsqueletoGraficoComponent, WindowPanelComponent, SelectFiltroComponent, GrupoFiltrosComponent, FechaCierreBotonComponent],
  templateUrl: './dashboard.component.html',
})
export class CeroCuotasDashboardComponent {
  private readonly servicio = inject(CeroCuotasNuevasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly graficos = signal<BloqueGrafico[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Cortes de fecha del selector (como los cierres de los reportes mensuales); vacío hasta que responda el backend. */
  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  private consulta?: Subscription;

  constructor() {
    this.servicio.periodosDashboard().subscribe((opciones) => {
      this.periodos.set(opciones);
      if (opciones.length > 0) this.periodo.set(String(opciones[0].id));
    });

    // Un cambio de nivel o de fecha de corte recarga; la consulta en vuelo se cancela.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (nodo) this.cargar(nodo, periodo);
      onCleanup(() => this.consulta?.unsubscribe());
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  /** Reemite el nivel actual para forzar una nueva consulta sin cambiar la selección. */
  protected refrescar(): void {
    const nodo = this.nivelActual();
    if (nodo) this.onNivelSeleccionado({ ...nodo });
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): void {
    this.cargando.set(true);
    this.consulta = this.servicio.dashboard({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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

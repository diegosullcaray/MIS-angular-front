import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { kpisDeFilaTotal } from '../../models/seguros.model';
import { SegurosService } from '../../services/seguros.service';

/**
 * "Reporte Seguros Optativos" (`repositorio/actividad-diaria/seguro/seguro-com`)
 * — legado `repositorio/seguro-com` (`GRSCMISREP_01`), motor `table.regular`.
 *
 * Los KPIs de arriba y las mini-tarjetas de "Rendimiento por Tipo de Seguro
 * Optativo" NO son un bloque aparte: el legado los saca de la PRIMERA FILA de
 * la misma tabla (`kpiTotales` ← `dataSource[0]`).
 *
 * PENDIENTE: el legado trae además un selector de periodo que se llena con el
 * bloque `RS_FECH` (`meta1[0].json_result`) y reemplaza la fecha de corte. No se
 * migra todavía porque hace falta ver un payload real de ese `json_result` para
 * saber su forma exacta; con el corte del usuario el reporte ya funciona.
 */
@Component({
  selector: 'app-seguros-optativos',
  standalone: true,
  imports: [
    DecimalPipe,
    PercentPipe,
    HierSelectorComponent,
    TablaDinamicaComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './seguros-optativos.component.html',
  styleUrl: './seguros-optativos.component.css',
})
export class SegurosOptativosComponent {
  private readonly servicio = inject(SegurosService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Los KPIs salen de la fila total de la propia tabla, como en el legado. */
  protected readonly kpis = computed(() => kpisDeFilaTotal(this.tabla().filas));

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
    this.servicio.segurosOptativos({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (tabla) => {
        this.tabla.set(tabla);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
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
 * El selector de periodo sale de `RS_FECH` (`meta1[0].json_result`) y su valor
 * reemplaza a la fecha de corte del usuario en la consulta. No es un calendario
 * libre: son los cortes que el backend declara disponibles.
 */
@Component({
  selector: 'app-seguros-optativos',
  standalone: true,
  imports: [
    DecimalPipe,
    PercentPipe,
    HierSelectorComponent,
    SelectFiltroComponent,
    TablaDinamicaComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './seguros-optativos.component.html',
})
export class SegurosOptativosComponent {
  private readonly servicio = inject(SegurosService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Cortes disponibles; vacío mientras `RS_FECH` no responda. */
  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  /** Los KPIs salen de la fila total de la propia tabla, como en el legado. */
  protected readonly kpis = computed(() => kpisDeFilaTotal(this.tabla().filas));

  /** El mayor valor de las mini-tarjetas, para dibujar cada barra en proporción. */
  protected readonly maximoPorTipo = computed(() =>
    Math.max(0, ...this.kpis().porTipo.map((t) => t.valor)),
  );

  constructor() {
    this.servicio.periodosSegurosOptativos().subscribe((opciones) => {
      this.periodos.set(opciones);
      // El legado deja seleccionado el primero, que es el corte más reciente.
      if (opciones.length > 0) this.periodo.set(opciones[0].id);
    });

    // Un cambio de periodo recarga el reporte sobre el nivel que ya esté abierto.
    effect(() => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (nodo) this.cargar(nodo, periodo);
    });
  }

  /** Ancho de la barra de una mini-tarjeta, relativo al tipo de seguro más colocado. */
  protected proporcion(valor: number): number {
    const maximo = this.maximoPorTipo();
    return maximo > 0 ? (valor / maximo) * 100 : 0;
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): void {
    this.cargando.set(true);
    this.servicio.segurosOptativos({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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

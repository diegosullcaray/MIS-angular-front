import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { GraficoPieComponent } from '../../../../../../../../../shared/ui/graficos/grafico-pie/grafico-pie.component';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { BANCA_SOLIDARIA_VACIA, type BancaSolidariaResultado } from '../../models/banca-solidaria.model';
import { ReportesPdmService } from '../../services/reportes-pdm.service';

/**
 * "Gestión de Banca Solidaria"
 * (`repositorio/actividad-diaria/cartera/banca-solidaria`) — legado
 * `repositorio/banca-solidaria` (`GRBSOLI_01`).
 *
 * Va por el motor `table.regular`, así que las columnas las manda el backend y
 * se pinta con `<app-tabla-dinamica>` en vez de con `<app-reporte-simple>`.
 *
 * Las cinco tarjetas y las dos gráficas salen de la PRIMERA FILA de esa misma
 * tabla (la de totales), como en el legado: no hay bloques aparte.
 */
@Component({
  selector: 'app-banca-solidaria',
  standalone: true,
  imports: [
    DecimalPipe,
    HierSelectorComponent,
    TablaDinamicaComponent,
    GraficoMixtoComponent,
    GraficoPieComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './banca-solidaria.component.html',
  styleUrl: './banca-solidaria.component.css',
})
export class BancaSolidariaComponent {
  private readonly servicio = inject(ReportesPdmService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<BancaSolidariaResultado>(BANCA_SOLIDARIA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tabla = computed(() => this.reporte().tabla);
  protected readonly kpis = computed(() => this.reporte().kpis);
  protected readonly estadoRenovacion = computed(() => this.reporte().estadoRenovacion);
  protected readonly antiguedadCliente = computed(() => this.reporte().antiguedadCliente);

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
    this.servicio.bancaSolidaria({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (reporte) => {
        this.reporte.set(reporte);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

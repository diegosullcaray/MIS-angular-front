import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { DataTableComponent } from '../../../../../../../../../shared/ui/data-table/data-table.component';
import { DataTableCellDirective } from '../../../../../../../../../shared/ui/data-table/data-table-cell.directive';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { MapaUbicacionComponent } from '../../../../../../../../../shared/ui/mapas/mapa-ubicacion/mapa-ubicacion.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import type { BloqueGrafico } from '../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import {
  BUSQUEDA_DETALLE_CULTIVO,
  CARTERA_AGRICOLA_VACIA,
  COLUMNAS_DETALLE_CULTIVO,
  GRAFICOS_AGRICOLA,
  filasDeCultivo,
  totalesDeCultivo,
  type CarteraAgricolaResultado,
  type DetalleCultivo,
  type UbicacionCliente,
} from '../../../../../actividad-diaria/components/Cartera/models/cartera-agricola.model';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';

/** "Cartera Agrícola - Cultivos" (`repositorio/actividad-mensual/cartera/agro-mix-m`). */
@Component({
  selector: 'app-mensual-cartera-agricola-cultivos',
  standalone: true,
  imports: [
    DecimalPipe,
    DialogModule,
    ButtonModule,
    TooltipModule,
    HierSelectorComponent,
    SelectFiltroComponent,
    TablaDinamicaComponent,
    DataTableComponent,
    DataTableCellDirective,
    GraficoMixtoComponent,
    MapaUbicacionComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './cartera-agricola-cultivos.component.html',
  styleUrl: './cartera-agricola-cultivos.component.css',
})
export class CarteraAgricolaCultivosComponent {
  private readonly servicio = inject(ActividadMensualRepoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly columnasDetalle = COLUMNAS_DETALLE_CULTIVO;
  protected readonly busquedaDetalle = BUSQUEDA_DETALLE_CULTIVO;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<CarteraAgricolaResultado>(CARTERA_AGRICOLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  protected readonly totales = computed(() => this.reporte().totales);
  protected readonly tabla = computed(() => this.reporte().tabla);

  /** Fila del nivel elegida en la tabla: al elegirla se pasa a la vista de gráficos. */
  protected readonly filaSeleccionada = signal<Record<string, unknown> | null>(null);
  protected readonly graficos = signal<BloqueGrafico[]>([]);
  protected readonly cargandoGraficos = signal(false);

  /** Detalle del cultivo elegido en un gráfico; `null` mantiene el modal cerrado. */
  protected readonly detalle = signal<DetalleCultivo | null>(null);

  /** Cliente cuyo mapa se está viendo dentro del modal; `null` muestra la tabla. */
  protected readonly ubicacion = signal<UbicacionCliente | null>(null);

  private filasPorGrafico: Record<string, Record<string, unknown>[]> = {};

  constructor() {
    this.servicio.periodos('RS_FECH').subscribe((opciones) => {
      this.periodos.set(opciones);
      if (opciones.length > 0) this.periodo.set(String(opciones[0].id));
    });

    effect(() => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (nodo) this.cargar(nodo, periodo);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.volverAlListado();
  }

  /** El legado baja al detalle con el `htipcod`/`cod_rel` de la propia fila, no con el nodo elegido. */
  protected onFilaSeleccionada(fila: Record<string, unknown>): void {
    const tip_cod = Number(fila['htipcod']);
    const cod_rel = String(fila['cod_rel'] ?? '');
    if (!Number.isFinite(tip_cod) || !cod_rel) return;

    this.filaSeleccionada.set(fila);
    this.cargandoGraficos.set(true);

    this.servicio.detalleGraficosAgricola({ tip_cod, cod_rel }, this.periodo() || undefined).subscribe({
      next: ({ graficos, filasPorGrafico }) => {
        this.graficos.set(graficos);
        this.filasPorGrafico = filasPorGrafico;
        this.cargandoGraficos.set(false);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los gráficos de detalle', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoGraficos.set(false);
        this.volverAlListado();
      },
    });
  }

  protected volverAlListado(): void {
    this.filaSeleccionada.set(null);
    this.graficos.set([]);
    this.detalle.set(null);
    this.filasPorGrafico = {};
  }

  /** `id` del gráfico que abre detalle, o `undefined` si ese gráfico no tiene clic en el legado. */
  protected idDetalle(indice: number): string | undefined {
    return GRAFICOS_AGRICOLA[indice]?.id;
  }

  /** Clic en una barra: abre el listado de clientes de ese cultivo, como `showDetailsPopup()`. */
  protected onCultivoSeleccionado(cultivo: string, idGrafico: string | undefined): void {
    const origen = idGrafico ? this.filasPorGrafico[idGrafico] : undefined;
    if (!origen) return;

    const filas = filasDeCultivo(origen, cultivo);
    this.detalle.set({ cultivo, filas, totales: totalesDeCultivo(filas) });
  }

  protected cerrarDetalle(): void {
    this.detalle.set(null);
    this.ubicacion.set(null);
  }

  /**
   * Clic en un cliente del listado: abre su ubicación en el mapa — legado
   * `ddMaps()`, que lee `HLATITU`/`HLONGIT` de la propia fila.
   */
  protected onClienteSeleccionado(fila: Record<string, unknown>): void {
    const lat = Number(fila['HLATITU']);
    const lng = Number(fila['HLONGIT']);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      this.toast.info('Sin coordenadas', 'Este cliente no tiene registradas coordenadas geográficas.');
      return;
    }

    const etiqueta = String(fila['HDESCLI'] ?? 'Cliente');
    this.ubicacion.set({ lat, lng, etiqueta });
  }

  protected volverAlListadoDeClientes(): void {
    this.ubicacion.set(null);
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): void {
    this.cargando.set(true);
    this.volverAlListado();
    this.servicio.carteraAgricola({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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

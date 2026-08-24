import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { HierSelectorComponent } from '../../../../../../ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../ui/tabla-dinamica/tabla-dinamica.component';
import { GraficoApexComponent } from '../../../../../../ui/grafico-apex/grafico-apex.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { BloqueGrafico } from '../../../../../../models/grafico-reporte.model';
import {
  CARTERA_AGRICOLA_VACIA,
  COLUMNAS_DETALLE_CULTIVO,
  GRAFICOS_AGRICOLA,
  filasDeCultivo,
  totalesDeCultivo,
  type CarteraAgricolaResultado,
  type DetalleCultivo,
} from '../../models/cartera-agricola.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';

/** "Cartera Agrícola - Cultivos" (`repositorio/actividad-diaria/cartera/agro-mix`). */
@Component({
  selector: 'app-cartera-agricola-cultivos',
  standalone: true,
  imports: [
    DecimalPipe,
    DialogModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    GraficoApexComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './cartera-agricola-cultivos.component.html',
  styleUrl: './cartera-agricola-cultivos.component.css',
})
export class CarteraAgricolaCultivosComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly columnasDetalle = COLUMNAS_DETALLE_CULTIVO;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<CarteraAgricolaResultado>(CARTERA_AGRICOLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly totales = computed(() => this.reporte().totales);
  protected readonly tabla = computed(() => this.reporte().tabla);

  /** Fila del nivel elegida en la tabla: al elegirla se pasa a la vista de gráficos. */
  protected readonly filaSeleccionada = signal<Record<string, unknown> | null>(null);
  protected readonly graficos = signal<BloqueGrafico[]>([]);
  protected readonly cargandoGraficos = signal(false);

  /** Detalle del cultivo elegido en un gráfico; `null` mantiene el modal cerrado. */
  protected readonly detalle = signal<DetalleCultivo | null>(null);

  private filasPorGrafico: Record<string, Record<string, unknown>[]> = {};

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);
    this.volverAlListado();

    this.servicio.carteraAgricola({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
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

  /** El legado baja al detalle con el `htipcod`/`cod_rel` de la propia fila, no con el nodo elegido. */
  protected onFilaSeleccionada(fila: Record<string, unknown>): void {
    const tip_cod = Number(fila['htipcod']);
    const cod_rel = String(fila['cod_rel'] ?? '');
    if (!Number.isFinite(tip_cod) || !cod_rel) return;

    this.filaSeleccionada.set(fila);
    this.cargandoGraficos.set(true);

    this.servicio.detalleGraficosAgricola({ tip_cod, cod_rel }).subscribe({
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
  }
}

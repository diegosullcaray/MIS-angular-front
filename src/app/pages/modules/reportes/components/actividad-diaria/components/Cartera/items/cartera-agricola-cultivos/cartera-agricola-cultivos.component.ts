import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HierSelectorComponent } from '../../../../../../ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../ui/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { CARTERA_AGRICOLA_VACIA, type CarteraAgricolaResultado } from '../../models/cartera-agricola.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';
import { GraficoApexComponent } from '../../../../../../ui/grafico-apex/grafico-apex.component';
import type { BloqueGrafico } from '../../../../../../models/grafico-reporte.model';
import { MapaComponent, type MarcadorMapa } from '../../../../../../../../../shared/ui/mapa/mapa.component';
import { DialogModule } from 'primeng/dialog';

/** "Cartera Agrícola - Cultivos" (`repositorio/actividad-diaria/cartera/agro-mix`). */
@Component({
  selector: 'app-cartera-agricola-cultivos',
  standalone: true,
  imports: [DecimalPipe, HierSelectorComponent, TablaDinamicaComponent, EmptyStateComponent, WindowPanelComponent, GraficoApexComponent, MapaComponent, DialogModule],
  templateUrl: './cartera-agricola-cultivos.component.html',
  styleUrl: './cartera-agricola-cultivos.component.css',
})
export class CarteraAgricolaCultivosComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<CarteraAgricolaResultado>(CARTERA_AGRICOLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly totales = computed(() => this.reporte().totales);
  protected readonly tabla = computed(() => this.reporte().tabla);

  protected readonly filaSeleccionada = signal<Record<string, unknown> | null>(null);
  protected readonly graficos = signal<BloqueGrafico[]>([]);

  // Estado del modal de detalle (clic en una barra de gráfica)
  protected readonly modalVisible = signal(false);
  protected readonly modalTitulo = signal('');
  protected readonly modalMarcadores = signal<MarcadorMapa[]>([]);
  private dataCruda: { saldoCapital: Record<string, unknown>[]; saldoVencido: Record<string, unknown>[] } = { saldoCapital: [], saldoVencido: [] };

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);
    this.filaSeleccionada.set(null);

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

  protected onFilaSeleccionada(fila: Record<string, unknown>): void {
    const tip_cod = Number(fila['htipcod']);
    const cod_rel = String(fila['cod_rel'] ?? '');
    if (Number.isNaN(tip_cod) || !cod_rel) return;

    this.cargando.set(true);
    this.filaSeleccionada.set(fila);

    this.servicio.detalleGraficosAgricola(tip_cod, cod_rel).subscribe({
      next: ({ graficos, dataCruda }) => {
        this.graficos.set(graficos);
        this.dataCruda = dataCruda;
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los gráficos de detalle');
        this.cargando.set(false);
        this.filaSeleccionada.set(null);
      }
    });
  }

  protected onVolver(): void {
    this.filaSeleccionada.set(null);
  }

  /** Se dispara cuando el usuario hace clic en una barra/punto de una gráfica. */
  protected onPuntoSeleccionado(categoria: string): void {
    // Buscar en ambas fuentes de datos crudos cuáles coinciden con la categoría
    const todos = [...this.dataCruda.saldoCapital, ...this.dataCruda.saldoVencido];
    const filtrados = todos.filter(
      (item) => (item['HDESCUL_Agrupado'] || item['HDESCUL']) === categoria
    );

    // Construir marcadores solo con filas que tengan coordenadas válidas
    const marcadores: MarcadorMapa[] = filtrados
      .filter((item) => item['HLATITU'] && item['HLONGIT'])
      .map((item) => ({
        lat: Number(item['HLATITU']),
        lng: Number(item['HLONGIT']),
        titulo: String(item['HNOMBRES'] ?? item['HDNOMBRE'] ?? 'Cliente'),
        subtitulo: item['HCAPMON'] ? `Saldo: S/ ${Number(item['HCAPMON']).toLocaleString('es-PE')}` : undefined,
      }));

    this.modalTitulo.set(`Detalle: ${categoria}`);
    this.modalMarcadores.set(marcadores);
    this.modalVisible.set(true);
  }
}

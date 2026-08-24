import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { HierSelectorComponent } from '../../../../../../ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../ui/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../ui/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import {
  COLUMNAS_CLIENTES_SALIDAS,
  COLUMNAS_SALIDAS,
  RESULTADO_SALIDAS_VACIO,
  TITULO_DETALLE,
  TOPES_DETALLE,
  TOPE_DETALLE_POR_DEFECTO,
  colorChurn,
  metricaDeTarjeta,
  type ResultadoSalidas,
} from '../../models/monitor-salidas.model';
import { MonitorSalidasService } from '../../services/monitor-salidas.service';

/** "Monitor Salidas y Retenciones" (`repositorio/actividad-diaria/cartera/mon-retenciones`). */
@Component({
  selector: 'app-monitor-salidas-retenciones',
  standalone: true,
  imports: [
    DecimalPipe,
    DialogModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './monitor-salidas-retenciones.component.html',
  styleUrl: './monitor-salidas-retenciones.component.css',
})
export class MonitorSalidasRetencionesComponent {
  private readonly servicio = inject(MonitorSalidasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly columnas = COLUMNAS_SALIDAS;
  protected readonly columnasClientes = COLUMNAS_CLIENTES_SALIDAS;
  protected readonly opcionesTope: OpcionFiltro<number>[] = TOPES_DETALLE.map((t) => ({ id: t, desc: `Top ${t}` }));

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly resultado = signal<ResultadoSalidas>(RESULTADO_SALIDAS_VACIO);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tarjetas = computed(() => this.resultado().cards);
  protected readonly filas = computed(() => this.resultado().table);

  /** Métrica abierta en el detalle (`sali1`/`sali3`/`clive`); `null` mantiene el modal cerrado. */
  protected readonly metrica = signal<string | null>(null);
  protected readonly tope = signal(TOPE_DETALLE_POR_DEFECTO);
  protected readonly clientes = signal<Record<string, unknown>[]>([]);
  protected readonly cargandoDetalle = signal(false);

  /** Nodo cuyo detalle se está viendo: puede ser el del nivel o el de una fila de la tabla. */
  private nodoDetalle: HierarquiaNodo | null = null;

  protected readonly tituloDetalle = computed(() => TITULO_DETALLE[this.metrica() ?? ''] ?? '');

  constructor() {
    // El tope es del detalle: al cambiarlo se vuelve a pedir solo ese listado.
    effect(() => {
      const metrica = this.metrica();
      const top = this.tope();
      if (metrica && this.nodoDetalle) this.cargarDetalle(this.nodoDetalle, metrica, top);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);
    this.cerrarDetalle();

    this.servicio.resultados({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected colorDeChurn(fila: Record<string, unknown>): string {
    return colorChurn(fila['ret'] as number);
  }

  /** Las tarjetas 0 y 3 no abren detalle en el legado. */
  protected tarjetaAbreDetalle(indice: number): boolean {
    return metricaDeTarjeta(indice) !== undefined;
  }

  protected onTarjeta(indice: number): void {
    const metrica = metricaDeTarjeta(indice);
    const nodo = this.nivelActual();
    if (!metrica || !nodo) return;
    this.abrirDetalle(nodo, metrica);
  }

  /**
   * Clic en la tabla: `desc` es el drill-down de jerarquía del legado y `ret`
   * no abre nada; el resto de columnas abre el listado de clientes de esa fila.
   */
  protected onFila(fila: Record<string, unknown>): void {
    const tip_cod = Number(fila['tip_cod']);
    const cod_rel = String(fila['cod_rel'] ?? '');
    if (!Number.isFinite(tip_cod) || !cod_rel) return;
    this.abrirDetalle({ tip_cod, cod_rel, des_rel: String(fila['desc'] ?? '') }, 'sali1');
  }

  protected cerrarDetalle(): void {
    this.metrica.set(null);
    this.clientes.set([]);
    this.nodoDetalle = null;
  }

  private abrirDetalle(nodo: HierarquiaNodo, metrica: string): void {
    this.nodoDetalle = nodo;
    this.tope.set(TOPE_DETALLE_POR_DEFECTO);
    this.metrica.set(metrica);
  }

  private cargarDetalle(nodo: HierarquiaNodo, metrica: string, top: number): void {
    this.cargandoDetalle.set(true);
    this.servicio.detalle({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, metrica, top).subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el detalle', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoDetalle.set(false);
      },
    });
  }
}

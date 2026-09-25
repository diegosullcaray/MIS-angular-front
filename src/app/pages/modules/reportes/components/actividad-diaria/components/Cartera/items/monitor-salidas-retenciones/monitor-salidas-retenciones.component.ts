import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import type { Subscription } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { DataTableComponent } from '../../../../../../../../../shared/ui/data-table/data-table.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { InlineErrorComponent } from '../../../../../../../../../shared/ui/inline-error/inline-error.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { nodoDeFila } from '../../../../../../utils/nodo-fila.util';
import { RutaJerarquicaComponent } from '../../../../../../ui/ruta-jerarquica/ruta-jerarquica.component';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import {
  BUSQUEDA_CLIENTES_SALIDAS,
  CLAVE_DRILL_DOWN_SALIDAS,
  METRICAS_DETALLE_SALIDAS,
  COLUMNAS_CLIENTES_SALIDAS,
  COLUMNAS_SALIDAS,
  RESULTADO_SALIDAS_VACIO,
  TITULO_DETALLE,
  TOPES_DETALLE,
  TOPE_DETALLE_POR_DEFECTO,
  conSemaforoChurn,
  esNivelAsesor,
  metricaDeTarjeta,
  type ResultadoSalidas,
} from '../../models/monitor-salidas.model';
import { MonitorSalidasService } from '../../services/monitor-salidas.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

/**
 * "Monitor Salidas y Retenciones" (`repositorio/actividad-diaria/cartera/mon-retenciones`).
 *
 * Se navega por drill down, como en el legado (`mon-salidas/principal`): la descripción de cada fila
 * baja a ese nivel (`ddHier`) y las migas vuelven atrás (`changeHier`). El selector de jerarquía
 * queda oculto: solo resuelve el nodo inicial autorizado y lleva la ruta. Las columnas de salidas y
 * clientes por vencer abren el listado de clientes de esa métrica (`ddCli`); "Churn rate" no abre nada.
 */
@Component({
  selector: 'app-monitor-salidas-retenciones',
  standalone: true,
  imports: [
    DecimalPipe,
    DialogModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    DataTableComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    InlineErrorComponent,
    WindowPanelComponent,
    RutaJerarquicaComponent,
    GrupoFiltrosComponent,
  ],
  templateUrl: './monitor-salidas-retenciones.component.html',
})
export class MonitorSalidasRetencionesComponent {
  private readonly servicio = inject(MonitorSalidasService);
  private readonly toast = inject(ToastService);

  private readonly selectorJerarquia = viewChild(HierSelectorComponent);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly columnas = COLUMNAS_SALIDAS;
  protected readonly columnasClientes = COLUMNAS_CLIENTES_SALIDAS;
  protected readonly busquedaClientes = BUSQUEDA_CLIENTES_SALIDAS;
  protected readonly opcionesTope: OpcionFiltro<number>[] = TOPES_DETALLE.map((t) => ({ id: t, desc: `Top ${t}` }));

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly resultado = signal<ResultadoSalidas>(RESULTADO_SALIDAS_VACIO);
  protected readonly error = signal<string | null>(null);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tarjetas = computed(() => this.resultado().cards);
  /**
   * Las filas con su semáforo de churn ya calculado — es lo que dibuja el punto
   * de color de la columna "Churn rate", como el `trafficFn` del legado.
   */
  protected readonly filas = computed(() => conSemaforoChurn(this.resultado().table));

  /** Ruta de la raíz al nivel actual, para las migas. */
  protected readonly rutaJerarquica = signal<HierarquiaNodo[]>([]);

  /**
   * Celdas clicables: las métricas con detalle siempre y la descripción solo si alguna fila tiene
   * a dónde bajar — no se ofrece un enlace que no hace nada.
   */
  protected readonly columnasClicables = computed(() => {
    const bajan = this.filas().some((fila) => this.nodoHijo(fila));
    return bajan ? [CLAVE_DRILL_DOWN_SALIDAS, ...METRICAS_DETALLE_SALIDAS] : [...METRICAS_DETALLE_SALIDAS];
  });

  private consulta: Subscription | null = null;

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
    this.cerrarDetalle();
    this.cargar(nodo);
  }

  protected onRutaSeleccionada(ruta: HierarquiaNodo[]): void {
    this.rutaJerarquica.set(ruta);
  }

  protected reintentar(): void {
    const nodo = this.nivelActual();
    if (nodo) this.cargar(nodo);
  }

  /** Clic en una miga: vuelve a ese nivel. */
  protected volverANivel(indice: number): void {
    const ruta = this.rutaJerarquica();
    const nodo = ruta[indice];
    if (!nodo || indice === ruta.length - 1) return;

    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) {
      this.rutaJerarquica.set(ruta.slice(0, indice + 1));
      this.onNivelSeleccionado(nodo);
    }
  }

  private cargar(nodo: HierarquiaNodo): void {
    // Un drill down rápido no debe dejar que la respuesta del nivel anterior pise la del nuevo.
    this.consulta?.unsubscribe();
    this.error.set(null);
    this.cargando.set(true);
    this.resultado.set(RESULTADO_SALIDAS_VACIO);

    this.consulta = this.servicio.resultados({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el reporte. Inténtalo de nuevo en unos segundos.');
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
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
   * Clic en una celda, como el `ddEvent` del legado: `desc` baja de nivel (`ddHier`), `ret` no abre
   * nada y `sali1`/`sali3`/`clive` abren el listado de clientes de esa métrica para esa fila (`ddCli`).
   */
  protected onCeldaSeleccionada({ clave, fila }: { clave: string; fila: Record<string, unknown> }): void {
    if (clave === CLAVE_DRILL_DOWN_SALIDAS) {
      this.bajarANivel(fila);
      return;
    }
    if (!METRICAS_DETALLE_SALIDAS.includes(clave)) return;

    const nodo = nodoDeFila(fila, CLAVE_DRILL_DOWN_SALIDAS);
    if (nodo) this.abrirDetalle(nodo, clave);
  }

  private bajarANivel(fila: Record<string, unknown>): void {
    const nodo = this.nodoHijo(fila);
    if (!nodo) return;

    // Por el selector oculto, que emite el nodo y la ruta nueva. Si el nodo no está entre sus
    // opciones, se agrega a la ruta y se consulta igual.
    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) {
      this.rutaJerarquica.update((ruta) => [...ruta, nodo]);
      this.onNivelSeleccionado(nodo);
    }
  }

  /**
   * Nodo al que baja la fila. No baja la fila del asesor (`tip_cod` 1, último nivel en el legado) ni
   * la del nivel que ya se está viendo.
   */
  private nodoHijo(fila: Record<string, unknown>): HierarquiaNodo | null {
    const nodo = nodoDeFila(fila, CLAVE_DRILL_DOWN_SALIDAS);
    if (!nodo || esNivelAsesor(nodo.tip_cod)) return null;
    const actual = this.nivelActual();
    if (actual && nodo.tip_cod === actual.tip_cod && nodo.cod_rel === actual.cod_rel) return null;
    return nodo;
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

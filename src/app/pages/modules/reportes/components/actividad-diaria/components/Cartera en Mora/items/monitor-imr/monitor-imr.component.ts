import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import {
  COLUMNAS_CLIENTES_IMR,
  COLUMNAS_CLICABLES_IMR,
  COLUMNAS_CON_DETALLE_IMR,
  COLUMNA_DRILLDOWN_IMR,
  IMPULSA_IMR_POR_DEFECTO,
  OPCIONES_IMPULSA_IMR,
  RESULTADO_IMR_VACIO,
  TITULO_DETALLE_IMR,
  TOPES_DETALLE_IMR,
  TOPE_DETALLE_IMR_POR_DEFECTO,
  esFilaTotal,
  permiteDrilldown,
  type ResultadoImr,
} from '../../models/cartera-en-mora.model';
import { MonitorImrService } from '../../services/monitor-imr.service';

/** Componente de Monitor IMR. */
@Component({
  selector: 'app-monitor-imr',
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
  templateUrl: './monitor-imr.component.html',
})
export class MonitorImrComponent {
  private readonly servicio = inject(MonitorImrService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly columnasClientes = COLUMNAS_CLIENTES_IMR;
  protected readonly columnasClicables = COLUMNAS_CLICABLES_IMR;
  protected readonly opcionesImpulsa = OPCIONES_IMPULSA_IMR;
  protected readonly opcionesTope: OpcionFiltro<number>[] = TOPES_DETALLE_IMR.map((t) => ({ id: t, desc: `Top ${t}` }));

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly impulsa = signal(IMPULSA_IMR_POR_DEFECTO);
  protected readonly cargando = signal(false);
  protected readonly resultado = signal<ResultadoImr>(RESULTADO_IMR_VACIO);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tarjetas = computed(() => this.resultado().cards);
  protected readonly filas = computed(() => this.resultado().table);
  protected readonly columnas = computed(() => this.resultado().columnas);

  /** Métrica abierta en el detalle. */
  protected readonly metrica = signal<string | null>(null);
  protected readonly tope = signal(TOPE_DETALLE_IMR_POR_DEFECTO);
  protected readonly clientes = signal<Record<string, unknown>[]>([]);
  protected readonly cargandoDetalle = signal(false);

  /** Nodo de detalle. */
  private nodoDetalle: HierarquiaNodo | null = null;

  protected readonly tituloDetalle = computed(() => TITULO_DETALLE_IMR[this.metrica() ?? ''] ?? '');

  constructor() {
    // El `imp` es del reporte: cambiarlo recarga tarjetas y tabla del nivel actual.
    effect(() => {
      const nodo = this.nivelActual();
      const imp = this.impulsa();
      if (nodo) this.cargar(nodo, imp);
    });

    // El tope es del detalle: al cambiarlo se vuelve a pedir solo ese listado.
    effect(() => {
      const metrica = this.metrica();
      const top = this.tope();
      if (metrica && this.nodoDetalle) this.cargarDetalle(this.nodoDetalle, metrica, top);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.cerrarDetalle();
    this.nivelActual.set(nodo);
  }


  /** Maneja el clic en la tabla. */
  protected onCelda({ clave, fila }: { clave: string; fila: Record<string, unknown> }): void {
    if (esFilaTotal(fila)) return;

    const tip_cod = Number(fila['tip_cod']);
    const cod_rel = String(fila['cod_rel'] ?? '');
    if (!Number.isFinite(tip_cod) || !cod_rel) return;
    const nodo = { tip_cod, cod_rel, des_rel: String(fila['desc'] ?? '') };

    if (clave === COLUMNA_DRILLDOWN_IMR) {
      // `ddHier()` del legado: corta en Financiera, de ahí no se baja más.
      if (permiteDrilldown(fila)) this.onNivelSeleccionado(nodo as HierarquiaNodo);
      return;
    }

    if (COLUMNAS_CON_DETALLE_IMR.includes(clave)) this.abrirDetalle(nodo as HierarquiaNodo, clave);
  }

  protected cerrarDetalle(): void {
    this.metrica.set(null);
    this.clientes.set([]);
    this.nodoDetalle = null;
  }

  private abrirDetalle(nodo: HierarquiaNodo, metrica: string): void {
    this.nodoDetalle = nodo;
    this.tope.set(TOPE_DETALLE_IMR_POR_DEFECTO);
    this.metrica.set(metrica);
  }

  private cargar(nodo: HierarquiaNodo, imp: number): void {
    this.cargando.set(true);
    this.servicio.resultados({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, imp).subscribe({
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

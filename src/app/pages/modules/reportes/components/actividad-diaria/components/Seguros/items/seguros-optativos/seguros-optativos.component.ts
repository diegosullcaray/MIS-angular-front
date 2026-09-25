import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import type { Subscription } from 'rxjs';
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
import { CLAVE_DRILL_DOWN_SEGUROS, kpisDeFilaTotal, nodoDrillDownSeguros } from '../../models/seguros.model';
import { RutaJerarquicaComponent } from '../../../../../../ui/ruta-jerarquica/ruta-jerarquica.component';
import { SegurosService } from '../../services/seguros.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

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
 *
 * Se navega por drill down, como el legado: la jerarquía arranca en el nodo autorizado, la columna
 * `RNOMSUB` de cada fila baja a ese nivel (`ddHier`) y las migas vuelven atrás (`changeHier` sobre
 * `hierBuffer`). El selector de jerarquía queda oculto; el único filtro visible es el periodo.
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
    GrupoFiltrosComponent,
    RutaJerarquicaComponent,
  ],
  templateUrl: './seguros-optativos.component.html',
})
export class SegurosOptativosComponent {
  private readonly servicio = inject(SegurosService);
  private readonly toast = inject(ToastService);
  private readonly selectorJerarquia = viewChild(HierSelectorComponent);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Cortes disponibles; vacío mientras `RS_FECH` no responda. */
  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  /** Ruta de la raíz al nivel actual, para las migas (`hierBuffer` del legado). */
  protected readonly rutaJerarquica = signal<HierarquiaNodo[]>([]);

  /** `RNOMSUB` solo es clicable si alguna fila tiene a dónde bajar. */
  protected readonly columnasDrillDown = computed(() =>
    this.tabla().filas.some((fila) => this.nodoHijo(fila)) ? [CLAVE_DRILL_DOWN_SEGUROS] : [],
  );

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
    // `onCleanup` cancela la consulta en vuelo al bajar/subir de nivel o cambiar de periodo.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (nodo) {
        const consulta = this.cargar(nodo, periodo);
        onCleanup(() => consulta.unsubscribe());
      }
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

  protected onRutaSeleccionada(ruta: HierarquiaNodo[]): void {
    this.rutaJerarquica.set(ruta);
  }

  /** Clic en una celda: solo `RNOMSUB` baja de nivel, como `ddHier` del legado. */
  protected onCeldaSeleccionada({ clave, fila }: { clave: string; fila: Record<string, unknown> }): void {
    if (clave !== CLAVE_DRILL_DOWN_SEGUROS) return;
    const nodo = this.nodoHijo(fila);
    if (!nodo) return;

    // Por el selector oculto, que emite el nodo y la ruta nueva. Si el nodo no está entre sus
    // opciones, se agrega a la ruta y se consulta igual.
    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) {
      this.rutaJerarquica.update((ruta) => [...ruta, nodo]);
      this.onNivelSeleccionado(nodo);
    }
  }

  /** Clic en una miga: vuelve a ese nivel y recorta la ruta (`changeHier`). */
  protected volverANivel(indice: number): void {
    const ruta = this.rutaJerarquica();
    const nodo = ruta[indice];
    if (!nodo || indice === ruta.length - 1) return;

    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) {
      this.rutaJerarquica.set(ruta.slice(0, indice + 1));
      this.onNivelSeleccionado(nodo);
    }
  }

  /** Nodo al que baja la fila; `null` si no baja o es el nivel que ya se está viendo. */
  private nodoHijo(fila: Record<string, unknown>): HierarquiaNodo | null {
    const nodo = nodoDrillDownSeguros(fila);
    const actual = this.nivelActual();
    if (!nodo || (actual && nodo.tip_cod === actual.tip_cod && nodo.cod_rel === actual.cod_rel)) return null;
    return nodo;
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): Subscription {
    this.cargando.set(true);
    return this.servicio.segurosOptativos({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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

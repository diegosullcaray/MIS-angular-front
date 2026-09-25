import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import type { Subscription } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { GraficoPieComponent } from '../../../../../../../../../shared/ui/graficos/grafico-pie/grafico-pie.component';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { nodoDeFila } from '../../../../../../utils/nodo-fila.util';
import { RutaJerarquicaComponent } from '../../../../../../ui/ruta-jerarquica/ruta-jerarquica.component';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { BANCA_SOLIDARIA_VACIA, CLAVE_DRILL_DOWN_BANCA_SOLIDARIA, type BancaSolidariaResultado } from '../../models/banca-solidaria.model';
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
 *
 * Se navega por drill down, como el legado: la jerarquía arranca en el nodo autorizado, la
 * descripción de cada fila baja a ese nivel (`ddHier`, con `htipcod` + `hcodrel`) y las migas
 * vuelven atrás (`changeHier` sobre `hierBuffer`). El selector de jerarquía queda oculto.
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
    RutaJerarquicaComponent,
  ],
  templateUrl: './banca-solidaria.component.html',
})
export class BancaSolidariaComponent {
  private readonly servicio = inject(ReportesPdmService);
  private readonly toast = inject(ToastService);
  private readonly selectorJerarquia = viewChild(HierSelectorComponent);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<BancaSolidariaResultado>(BANCA_SOLIDARIA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tabla = computed(() => this.reporte().tabla);
  protected readonly kpis = computed(() => this.reporte().kpis);
  protected readonly estadoRenovacion = computed(() => this.reporte().estadoRenovacion);
  protected readonly antiguedadCliente = computed(() => this.reporte().antiguedadCliente);

  /** Ruta de la raíz al nivel actual, para las migas (`hierBuffer` del legado). */
  protected readonly rutaJerarquica = signal<HierarquiaNodo[]>([]);

  /** La descripción solo es clicable si alguna fila tiene a dónde bajar. */
  protected readonly columnasDrillDown = computed(() =>
    this.tabla().filas.some((fila) => this.nodoHijo(fila)) ? [CLAVE_DRILL_DOWN_BANCA_SOLIDARIA] : [],
  );

  constructor() {
    // `onCleanup` cancela la consulta en vuelo al bajar o subir de nivel.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      if (nodo) {
        const consulta = this.cargar(nodo);
        onCleanup(() => consulta.unsubscribe());
      }
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  protected onRutaSeleccionada(ruta: HierarquiaNodo[]): void {
    this.rutaJerarquica.set(ruta);
  }

  /** Clic en una celda: solo la descripción baja de nivel, como `ddHier` del legado. */
  protected onCeldaSeleccionada({ clave, fila }: { clave: string; fila: Record<string, unknown> }): void {
    if (clave !== CLAVE_DRILL_DOWN_BANCA_SOLIDARIA) return;
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

  /** Nodo al que baja la fila; `null` para la fila del nivel que ya se está viendo (el total). */
  private nodoHijo(fila: Record<string, unknown>): HierarquiaNodo | null {
    const nodo = nodoDeFila(fila, CLAVE_DRILL_DOWN_BANCA_SOLIDARIA);
    const actual = this.nivelActual();
    if (!nodo || (actual && nodo.tip_cod === actual.tip_cod && nodo.cod_rel === actual.cod_rel)) return null;
    return nodo;
  }

  private cargar(nodo: HierarquiaNodo): Subscription {
    this.cargando.set(true);
    return this.servicio.bancaSolidaria({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
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

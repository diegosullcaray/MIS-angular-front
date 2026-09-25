import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { VinculacionCarteraService } from '../../services/vinculacion-cartera.service';
import { RutaJerarquicaComponent } from '../../../../../../ui/ruta-jerarquica/ruta-jerarquica.component';
import { nodoDeFila } from '../../../../../../utils/nodo-fila.util';
import type { ColumnaDinamica } from '../../../../../../../../../shared/ui/tablas/models/tabla-dinamica.model';

/**
 * "Vinculación Cartera" — legado `actividad-diaria/carterizacion-com/pasivocom` (`RS_MON_SALCAP_COM_01`).
 *
 * Se navega por drill down, como *Cartera Agrícola*: la descripción de cada fila baja a ese nivel y
 * las migas vuelven atrás. El selector de jerarquía queda oculto: solo resuelve el nodo inicial
 * autorizado y lleva la ruta.
 */
@Component({
  selector: 'app-vinculacion-cartera',
  standalone: true,
  imports: [DecimalPipe, HierSelectorComponent, TablaDinamicaComponent, EmptyStateComponent, WindowPanelComponent, RutaJerarquicaComponent],
  templateUrl: './vinculacion-cartera.component.html',
})
export class VinculacionCarteraComponent {
  private readonly servicio = inject(VinculacionCarteraService);
  private readonly toast = inject(ToastService);
  private readonly selectorJerarquia = viewChild(HierSelectorComponent);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly kpis = computed(() => this.tabla().kpis ?? []);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Ruta de la raíz al nivel actual, para las migas. */
  protected readonly rutaJerarquica = signal<HierarquiaNodo[]>([]);

  /** Columna con el nombre de la fila (la primera): es la que baja de nivel. */
  private readonly claveEtiqueta = computed(() => primeraHoja(this.tabla().columnas)?.key ?? null);

  /** Solo clicable si las filas traen su nodo; sin él no se ofrece un enlace que no hace nada. */
  protected readonly columnasDrillDown = computed(() => {
    const clave = this.claveEtiqueta();
    return clave && this.tabla().filas.some((fila) => this.nodoHijo(fila)) ? [clave] : [];
  });

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.obtener({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
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

  protected onRutaSeleccionada(ruta: HierarquiaNodo[]): void {
    this.rutaJerarquica.set(ruta);
  }

  /** Clic en la descripción de una fila: baja a ese nivel. */
  protected onCeldaSeleccionada(evento: { clave: string; fila: Record<string, unknown> }): void {
    if (evento.clave !== this.claveEtiqueta()) return;
    const nodo = this.nodoHijo(evento.fila);
    if (!nodo) return;

    // Por el selector oculto, que emite el nodo y la ruta nueva. Si el nodo no está entre sus
    // opciones, se agrega a la ruta y se consulta igual.
    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) {
      this.rutaJerarquica.update((ruta) => [...ruta, nodo]);
      this.onNivelSeleccionado(nodo);
    }
  }

  /** Clic en una miga (o "Volver" en móvil): vuelve a ese nivel. */
  protected volverANivel(indice: number): void {
    const ruta = this.rutaJerarquica();
    const nodo = ruta[indice];
    if (!nodo || indice === ruta.length - 1) return;

    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) {
      this.rutaJerarquica.set(ruta.slice(0, indice + 1));
      this.onNivelSeleccionado(nodo);
    }
  }

  /**
   * Nodo de la fila, salvo que sea el nivel que ya se está viendo (la fila de totales). Si la fila
   * no trae su `htipcod`/`cod_rel`, se busca por nombre entre las opciones que el selector oculto ya
   * cargó para el nivel siguiente, como si se eligiera en el desplegable.
   */
  private nodoHijo(fila: Record<string, unknown>): HierarquiaNodo | null {
    const clave = this.claveEtiqueta() ?? undefined;
    const nodo =
      nodoDeFila(fila, clave) ??
      (clave ? (this.selectorJerarquia()?.opcionPorDescripcion(String(fila[clave] ?? '')) ?? null) : null);
    const actual = this.nivelActual();
    if (!nodo || (actual && nodo.tip_cod === actual.tip_cod && nodo.cod_rel === actual.cod_rel)) return null;
    return nodo;
  }
}

/** Primera columna hoja (la de la etiqueta de la fila), bajando por los grupos anidados. */
function primeraHoja(columnas: readonly ColumnaDinamica[]): ColumnaDinamica | undefined {
  const primera = columnas[0];
  return primera?.subs?.length ? primeraHoja(primera.subs) : primera;
}

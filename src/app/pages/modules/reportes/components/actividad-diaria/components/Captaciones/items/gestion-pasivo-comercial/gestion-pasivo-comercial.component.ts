import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { GestionPasivoComercialService } from '../../services/gestion-pasivo-comercial.service';
import { nodoDeFila } from '../../../../../../utils/nodo-fila.util';

/** "Gestión Pasivo Comercial" — legado `actividad-diaria/carterizacion/pasivo` (`RS_CARTEPAS_01`). */
@Component({
  selector: 'app-gestion-pasivo-comercial',
  standalone: true,
  imports: [HierSelectorComponent, TablaDinamicaComponent, EmptyStateComponent, WindowPanelComponent],
  templateUrl: './gestion-pasivo-comercial.component.html',
})
export class GestionPasivoComercialComponent {
  private readonly servicio = inject(GestionPasivoComercialService);
  private readonly toast = inject(ToastService);
  private readonly selectorJerarquia = viewChild(HierSelectorComponent);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /**
   * Drill down: la descripción de cada fila baja a ese nivel. Solo se vuelve clicable si las filas
   * traen su nodo (`htipcod` + `cod_rel`/`hcodrel`); sin él no se ofrece un enlace que no hace nada.
   */
  protected readonly columnasDrillDown = computed(() =>
    this.tabla().filas.some((fila) => this.nodoHijo(fila)) ? ['descripcion'] : [],
  );

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

  protected onCeldaSeleccionada(evento: { clave: string; fila: Record<string, unknown> }): void {
    if (evento.clave !== 'descripcion') return;
    const nodo = this.nodoHijo(evento.fila);
    if (!nodo) return;

    // Por el selector, así sus desplegables quedan en el nivel nuevo y "Limpiar" sigue sirviendo
    // para volver. Si el nodo no está entre sus opciones, se consulta igual.
    if (!this.selectorJerarquia()?.seleccionarNodo(nodo)) this.onNivelSeleccionado(nodo);
  }

  /**
   * Nodo de la fila, salvo que sea el nivel que ya se está viendo (p. ej. la fila de totales). Si la
   * fila no trae su `htipcod`/`cod_rel`, se busca por nombre entre las opciones que el selector ya
   * cargó para el nivel siguiente.
   */
  private nodoHijo(fila: Record<string, unknown>): HierarquiaNodo | null {
    const nodo =
      nodoDeFila(fila) ?? this.selectorJerarquia()?.opcionPorDescripcion(String(fila['descripcion'] ?? '')) ?? null;
    const actual = this.nivelActual();
    if (!nodo || (actual && nodo.tip_cod === actual.tip_cod && nodo.cod_rel === actual.cod_rel)) return null;
    return nodo;
  }
}

import { Component, computed, effect, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { TableroDigitalService } from '../../services/tablero-digital.service';

/**
 * "Tablero Digital Comercial" (`repositorio/actividad-diaria/tab-digital/usa-come`) — legado
 * `repositorio/usabilidad_comercial/usa_come` (`RS_TAB_COM_01`, motor `table.regular`).
 *
 * Como el legado diario: consulta con la fecha de corte del usuario (sin selector de periodo, que
 * es del reporte mensual `usabilidad-comercial-m`) y pinta las columnas estáticas del legado.
 */
@Component({
  selector: 'app-tablero-digital-comercial',
  standalone: true,
  imports: [
    HierSelectorComponent,
    TablaDinamicaComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './tablero-digital-comercial.component.html',
})
export class TableroDigitalComercialComponent {
  private readonly servicio = inject(TableroDigitalService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly columnas = computed(() => this.tabla().columnas);
  protected readonly filas = computed(() => this.tabla().filas);

  constructor() {
    // `onCleanup` cancela la consulta anterior al cambiar de nivel.
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

  private cargar(nodo: HierarquiaNodo): Subscription {
    this.cargando.set(true);
    this.tabla.set(TABLA_DINAMICA_VACIA);
    return this.servicio.tableroComercial({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
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

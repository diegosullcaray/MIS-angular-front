import { Component, computed, effect, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
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
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

/** "Tablero Digital Comercial" (`repositorio/actividad-mensual/tab-digital/usa-come-m`). */
@Component({
  selector: 'app-mensual-tablero-digital-comercial',
  standalone: true,
  imports: [
    HierSelectorComponent,
    SelectFiltroComponent,
    TablaDinamicaComponent,
    EmptyStateComponent,
    WindowPanelComponent,
    GrupoFiltrosComponent,
  ],
  templateUrl: './tablero-digital-comercial.component.html',
  styleUrl: './tablero-digital-comercial.component.css',
})
export class TableroDigitalComercialComponent {
  private readonly servicio = inject(ActividadMensualRepoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  protected readonly columnas = computed(() => this.tabla().columnas);
  protected readonly filas = computed(() => this.tabla().filas);

  /** `RS_FECH` ya respondió (con o sin cierres): recién ahí se consulta, como el legado. */
  private readonly periodosListos = signal(false);

  constructor() {
    this.servicio.periodos('RS_FECH').subscribe({
      next: (opciones) => {
        this.periodos.set(opciones);
        if (opciones.length > 0) this.periodo.set(String(opciones[0].id));
        this.periodosListos.set(true);
      },
      error: () => this.periodosListos.set(true),
    });

    // `onCleanup` cancela la consulta en vuelo: sin él, una respuesta tardía del nivel o del
    // cierre anterior pisaba la tabla del actual.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (!nodo) return;
      this.cargando.set(true);
      if (!this.periodosListos()) return;
      const sub = this.cargar(nodo, periodo);
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): Subscription {
    return this.servicio.tableroDigitalComercial({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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

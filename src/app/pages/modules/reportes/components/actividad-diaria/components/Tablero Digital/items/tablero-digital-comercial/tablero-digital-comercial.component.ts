import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { TableroDigitalService } from '../../services/tablero-digital.service';

/**
 * "Tablero Digital Comercial"
 * (`repositorio/actividad-diaria/tab-digital/usa-come`) — legado
 * `repositorio/usabilidad-comercial-m` (`RS_TAB_COM_01`).
 *
 * El único del módulo que NO sale de `cra-map.ts`: vive en el repositorio, va
 * por el motor `table.regular` (columnas dinámicas) y su corte no es el del
 * usuario sino el del selector de periodo (`RS_FECH`), igual que "Seguros
 * Optativos".
 */
@Component({
  selector: 'app-tablero-digital-comercial',
  standalone: true,
  imports: [
    HierSelectorComponent,
    SelectFiltroComponent,
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

  /** Cortes disponibles; vacío mientras `RS_FECH` no responda. */
  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  protected readonly columnas = computed(() => this.tabla().columnas);
  protected readonly filas = computed(() => this.tabla().filas);

  constructor() {
    this.servicio.periodosTableroComercial().subscribe((opciones) => {
      this.periodos.set(opciones);
      // El legado deja seleccionado el primero, que es el corte más reciente.
      if (opciones.length > 0) this.periodo.set(opciones[0].id);
    });

    // Un cambio de periodo recarga el reporte sobre el nivel que ya esté abierto.
    effect(() => {
      const nodo = this.nivelActual();
      const periodo = this.periodo();
      if (nodo) this.cargar(nodo, periodo);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, periodo: string): void {
    this.cargando.set(true);
    this.servicio.tableroComercial({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, periodo || undefined).subscribe({
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

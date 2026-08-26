import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import {
  FILTRO_AGENDA_POR_DEFECTO,
  OPCIONES_NIVEL_FUGA,
  OPCIONES_NIVEL_PROPENSION,
  OPCIONES_RANGO_AGENDA,
} from '../../models/campanas.model';
import { CampanasService } from '../../services/campanas.service';

/**
 * "Agendamiento" (`repositorio/actividad-diaria/campanias/agendamiento`) —
 * legado `repositorio/agenda-comercial`.
 *
 * Cuatro tablas del motor `table.regular` (columnas dinámicas del backend),
 * apiladas como en el legado. `fuga` y `prop` afectan a las cuatro; el rango
 * (`nom`) solo a las dos últimas, que son las de detalle.
 */
@Component({
  selector: 'app-agendamiento',
  standalone: true,
  imports: [
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './agendamiento.component.html',
  styleUrl: './agendamiento.component.css',
})
export class AgendamientoComponent {
  private readonly servicio = inject(CampanasService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFuga = OPCIONES_NIVEL_FUGA;
  protected readonly opcionesPropension = OPCIONES_NIVEL_PROPENSION;
  protected readonly opcionesRango = OPCIONES_RANGO_AGENDA;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly fuga = signal(FILTRO_AGENDA_POR_DEFECTO);
  protected readonly propension = signal(FILTRO_AGENDA_POR_DEFECTO);
  protected readonly rango = signal(FILTRO_AGENDA_POR_DEFECTO);

  protected readonly cargando = signal(false);
  protected readonly tablas = signal<TablaDinamicaResultado[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Títulos de cada tabla, en el orden en que las apila el legado. */
  protected readonly titulos = [
    'Resumen de agendamiento',
    'Agendamiento por nivel',
    'Detalle de clientes agendados',
    'Detalle de gestiones',
  ];

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      const filtros = { fuga: this.fuga(), prop: this.propension(), rango: this.rango() };
      if (nodo) this.cargar(nodo, filtros);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, filtros: { fuga: number; prop: number; rango: number }): void {
    this.cargando.set(true);
    this.servicio.agendamiento({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, filtros).subscribe({
      next: (tablas) => {
        this.tablas.set(tablas);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

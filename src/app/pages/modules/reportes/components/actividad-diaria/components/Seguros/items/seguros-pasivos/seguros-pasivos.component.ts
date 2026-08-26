import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { SegurosService } from '../../services/seguros.service';

/**
 * "Seguros Pasivos"
 * (`repositorio/actividad-diaria/seguros-pasivos/seguros-pasivos`) — legado
 * `repositorio/seguros-pasivos`, motor `table.regular`.
 *
 * Cuatro tablas apiladas. El orden es el de la PANTALLA del legado, no el de
 * las llamadas: el resumen (`_03`) va primero aunque se pida tercero.
 *
 * El template del legado declara una quinta tabla ("Protección 360",
 * `dataSource5`) que ningún `subscribe` llega a llenar — queda fuera porque en
 * el legado tampoco muestra nada.
 */
@Component({
  selector: 'app-seguros-pasivos',
  standalone: true,
  imports: [HierSelectorComponent, TablaDinamicaComponent, EmptyStateComponent, WindowPanelComponent],
  templateUrl: './seguros-pasivos.component.html',
  styleUrl: './seguros-pasivos.component.css',
})
export class SegurosPasivosComponent {
  private readonly servicio = inject(SegurosService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tablas = signal<TablaDinamicaResultado[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Los `<span>` de título de cada bloque en el template del legado. */
  protected readonly titulos = ['Seguro Pasivo Resumen', 'Seguros Oncológicos', 'Vida Segura', 'Protección Total'];

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      if (nodo) this.cargar(nodo);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo): void {
    this.cargando.set(true);
    this.servicio.segurosPasivos({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
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

import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { TabsModule } from 'primeng/tabs';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { SegurosService } from '../../services/seguros.service';

/**
 * Seguros Pasivos — legado `repositorio/seguros-pasivos`.
 *
 * Cinco pestañas, no cinco tablas apiladas, y el orden es el de la pantalla: el
 * resumen va primero aunque se pida tercero. La quinta ("Protección 360") queda
 * vacía a propósito — en el legado tampoco muestra nada, porque las variables
 * que su plantilla declara no existen en el componente. Se deja para no cambiar
 * la navegación del reporte.
 */
@Component({
  selector: 'app-seguros-pasivos',
  standalone: true,
  imports: [HierSelectorComponent, TablaDinamicaComponent, EmptyStateComponent, WindowPanelComponent, TabsModule],
  templateUrl: './seguros-pasivos.component.html',
})
export class SegurosPasivosComponent {
  private readonly servicio = inject(SegurosService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tablas = signal<TablaDinamicaResultado[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /**
   * Las cinco pestañas del `mat-tab-group` del legado, con el índice de la
   * tabla que le toca a cada una. La última no tiene tabla: en el legado
   * tampoco.
   */
  protected readonly pestanas = [
    { id: 'resumen', titulo: 'Seguro Pasivo Resumen', indice: 0 },
    { id: 'oncologicos', titulo: 'Seguros Oncológicos', indice: 1 },
    { id: 'vida-segura', titulo: 'Vida Segura', indice: 2 },
    { id: 'proteccion-total', titulo: 'Protección Total', indice: 3 },
    { id: 'proteccion-360', titulo: 'Protección 360', indice: 4 },
  ];

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

import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { TabsModule } from 'primeng/tabs';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_MACRO, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { OPCIONES_PRODUCTO_PASIVO_AMPLIADO, TODOS } from '../../../../../../models/filtros.model';
import { PanelOperacionesService } from '../../services/panel-operaciones.service';

/** "Panel Operaciones" (`leg/com/rda/adm/panel-operaciones`) — panel de gestión de la RED. */
@Component({
  selector: 'app-panel-operaciones',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, SelectFiltroComponent, EmptyStateComponent, WindowPanelComponent, TabsModule],
  templateUrl: './panel-operaciones.component.html',
})
export class PanelOperacionesComponent {
  private readonly servicio = inject(PanelOperacionesService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_MACRO;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_PASIVO_AMPLIADO;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly producto = signal<string>(TODOS);

  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  /** Un tab por bloque, con los nombres del legado (`report-cra-v1p11.component.html`). */
  protected readonly tabs = [
    { id: 'reva', titulo: 'Panel Operación Reva', tabla: this.tabla1 },
    { id: 'regulatorio', titulo: 'Panel Operación Regulatorio', tabla: this.tabla2 },
  ];

  constructor() {
    effect(() => {
      const nodo = this.nivelActual();
      const prod = this.producto();
      if (nodo) this.cargar(nodo, prod);
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  private cargar(nodo: HierarquiaNodo, prod: string): void {
    this.cargando.set(true);
    this.servicio.obtener({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, prod).subscribe({
      next: ({ tabla1, tabla2 }) => {
        this.tabla1.set(tabla1);
        this.tabla2.set(tabla2);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

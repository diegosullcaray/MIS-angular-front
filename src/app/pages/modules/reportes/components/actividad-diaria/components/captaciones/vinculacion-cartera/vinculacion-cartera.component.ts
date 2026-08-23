import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../ui/tabla-reporte/tabla-reporte.component';
import { SelectFiltroComponent } from '../../../../../ui/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import { OPCIONES_PRODUCTO_PASIVO, TODOS } from '../../../../../models/filtros.model';
import { VinculacionCarteraService } from '../../../services/vinculacion-cartera.service';

/** "Vinculación Cartera" — Captación por Canal Comercial (`capta-caract-canal-comercial`). */
@Component({
  selector: 'app-vinculacion-cartera',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, SelectFiltroComponent, EmptyStateComponent, WindowPanelComponent],
  templateUrl: './vinculacion-cartera.component.html',
  styleUrl: './vinculacion-cartera.component.css',
})
export class VinculacionCarteraComponent {
  private readonly servicio = inject(VinculacionCarteraService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_PASIVO;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly producto = signal<string>(TODOS);
  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

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
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

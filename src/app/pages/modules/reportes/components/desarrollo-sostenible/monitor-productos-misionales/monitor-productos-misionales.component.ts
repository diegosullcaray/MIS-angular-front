import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { PARAMS_HIER_UNIDAD } from '../../../models/jerarquia.model';
import { DesarrolloSostenibleService } from '../../../services/desarrollo-sostenible.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../utils/hier-selector-error.util';
import { OPCIONES_PRODUCTO_MISIONAL } from '../../../models/desarrollo-sostenible/desarrollo-sostenible.model';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { KpiOperacionesDesembolsadas } from '../../../models/avance-comercial/avance-comercial.model';

/** "Monitor Productos Misionales" — migrado de la ruta `mon-desem-misi` (legado STG, `reportes/legacy/comercial/rda/administracion`, `cod_rep: 'Monitor_Dese_misi'`). */
@Component({
  selector: 'app-monitor-productos-misionales',
  standalone: true,
  imports: [FormsModule, HierSelectorComponent, TablaReporteComponent, SelectModule, SkeletonModule, ProgressSpinnerModule, TooltipModule, WindowPanelComponent],
  templateUrl: './monitor-productos-misionales.component.html',
  styleUrl: './monitor-productos-misionales.component.css',
})
export class MonitorProductosMisionalesComponent {
  private readonly servicio = inject(DesarrolloSostenibleService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_MISIONAL;

  protected readonly mostrarFiltros = signal(true);
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly productoSeleccionado = signal('TODOS');
  protected readonly cargando = signal(true);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly kpiOperaciones = signal<KpiOperacionesDesembolsadas | null>(null);
  protected readonly tablaDetalle = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tablaSimple = signal<TablaReporteResultado>(TABLA_VACIA);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargarReporte();
  }

  protected onProductoSeleccionado(prod: string): void {
    this.productoSeleccionado.set(prod);
    if (this.nivelActual()) this.cargarReporte();
  }

  private cargarReporte(): void {
    const nodo = this.nivelActual();
    if (!nodo) return;

    this.cargando.set(true);

    this.servicio.obtenerMonitorProductosMisionales({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, this.productoSeleccionado()).subscribe({
      next: ({ kpiOperaciones, tablaDetalle, tablaSimple }) => {
        this.tablaDetalle.set(tablaDetalle);
        this.tablaSimple.set(tablaSimple);
        this.kpiOperaciones.set(kpiOperaciones);
        this.cargando.set(false);

        if (tablaSimple.body.length === 0 && !kpiOperaciones) {
          this.toast.advertencia('Carga en proceso', 'Los datos podrían seguir procesándose en el servidor. Si ves valores en 0, intenta actualizar en unos minutos.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

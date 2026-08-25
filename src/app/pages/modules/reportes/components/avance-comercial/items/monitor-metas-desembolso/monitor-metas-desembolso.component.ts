import { Component, inject, signal } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HierSelectorComponent } from '../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../../../shared/ui/empty-state/empty-state.component';
import { PARAMS_HIER_UNIDAD } from '../../../../models/jerarquia.model';
import { AvanceComercialService } from '../../services/avance-comercial.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../utils/hier-selector-error.util';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo } from '../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';
import type { KpiMontoDesembolsado, KpiOperacionesDesembolsadas } from '../../models/avance-comercial.model';
import { TabsModule } from 'primeng/tabs';

/** "Monitor Metas Desembolso" — migrado de la ruta `mon-desem` (legado STG, `reportes/legacy/comercial/rda/administracion`, `cod_rep: 'Monitor_Dese'`). */
@Component({
  selector: 'app-monitor-metas-desembolso',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, SkeletonModule, ProgressSpinnerModule, WindowPanelComponent, TabsModule],
  templateUrl: './monitor-metas-desembolso.component.html',
  styleUrl: './monitor-metas-desembolso.component.css',
})
export class MonitorMetasDesembolsoComponent {
  private readonly servicio = inject(AvanceComercialService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);

  /** Los filtros arrancan plegados: al entrar ya se ve el reporte de la raíz. */
  protected readonly cargando = signal(false);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly kpiOperaciones = signal<KpiOperacionesDesembolsadas | null>(null);
  protected readonly kpiMonto = signal<KpiMontoDesembolsado | null>(null);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla4 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.obtenerMonitorMetasDesembolso({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: ({ kpiOperaciones, kpiMonto, tabla1, tabla2, tabla3, tabla4 }) => {
        this.kpiOperaciones.set(kpiOperaciones);
        this.kpiMonto.set(kpiMonto);
        this.tabla1.set(tabla1);
        this.tabla2.set(tabla2);
        this.tabla3.set(tabla3);
        this.tabla4.set(tabla4);
        this.cargando.set(false);

        if ([tabla1, tabla2, tabla3, tabla4].every((t) => t.body.length === 0)) {
          this.toast.advertencia('Carga en proceso', 'Los datos podrían seguir procesándose en el servidor. Si ves valores en 0, intenta actualizar en unos minutos.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
  // Agrega esto en tu componente TypeScript
  protected readonly tabs = [
    {
      id: 'tab1',
      titulo: 'Operaciones Desembolsadas',
      tablas: [this.tabla1] // Solo una tabla
    },
    {
      id: 'tab2',
      titulo: 'Monto Desembolsado',
      tablas: [this.tabla2, this.tabla3, this.tabla4] // Tres tablas
    }
  ];
}

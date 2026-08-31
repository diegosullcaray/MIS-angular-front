import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { MonitorMetasDesembolsoService } from '../../services/monitor-metas-desembolso.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';
import type { KpiMontoDesembolsado, KpiOperacionesDesembolsadas } from '../../models/monitor-metas-desembolso.model';

/** "Monitor de Desembolsos" — migrado de la ruta `leg/com/rda/sec/mon-desem` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-monitor-metas-desembolso-analista',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './monitor-metas-desembolso.component.html',
})
export class MonitorMetasDesembolsoAnalistaComponent {
  private readonly servicio = inject(MonitorMetasDesembolsoService);
  private readonly toast = inject(ToastService);


  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);

  protected readonly cargando = signal(false);
  protected readonly kpiOperaciones = signal<KpiOperacionesDesembolsadas | null>(null);
  protected readonly kpiMonto = signal<KpiMontoDesembolsado | null>(null);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);

  constructor() {
    this.cargarAsesores();
  }

  private cargarAsesores(): void {
    this.servicio.obtenerAsesores().subscribe({
      next: (asesores) => this.asesores.set(asesores),
      error: () => this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.'),
    });
  }

  protected onAsesorSeleccionado(asesor: AsesorSec | null): void {
    this.asesorSeleccionado.set(asesor);
    if (!asesor) return;

    this.cargando.set(true);
    this.servicio.obtenerMonitorMetasDesembolso({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ kpiOperaciones, kpiMonto, tabla1, tabla2, tabla3 }) => {
        this.kpiOperaciones.set(kpiOperaciones);
        this.kpiMonto.set(kpiMonto);
        this.tabla1.set(tabla1);
        this.tabla2.set(tabla2);
        this.tabla3.set(tabla3);
        this.cargando.set(false);

        if ([tabla1, tabla2, tabla3].every((t) => t.body.length === 0)) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene datos de desembolsos, o los datos podrían seguir procesándose.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

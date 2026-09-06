import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { MonitorMetasDesembolsoService } from '../../services/monitor-metas-desembolso.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { KpiMontoDesembolsado, KpiOperacionesDesembolsadas, ReporteMonitorMetasDesembolso } from '../../models/monitor-metas-desembolso.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Monitor de Desembolsos" — migrado de la ruta `leg/com/rda/sec/mon-desem` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-monitor-metas-desembolso-analista',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './monitor-metas-desembolso.component.html',
})
export class MonitorMetasDesembolsoAnalistaComponent extends ReporteAsesorBase<ReporteMonitorMetasDesembolso> {
  private readonly servicio = inject(MonitorMetasDesembolsoService);

  protected readonly kpiOperaciones = signal<KpiOperacionesDesembolsadas | null>(null);
  protected readonly kpiMonto = signal<KpiMontoDesembolsado | null>(null);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene datos de desembolsos, o los datos podrían seguir procesándose.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerMonitorMetasDesembolso(this.nodoDe(asesor));
  }

  protected recibir({ kpiOperaciones, kpiMonto, tabla1, tabla2, tabla3 }: ReporteMonitorMetasDesembolso): boolean {
    this.kpiOperaciones.set(kpiOperaciones);
    this.kpiMonto.set(kpiMonto);
    this.tabla1.set(tabla1);
    this.tabla2.set(tabla2);
    this.tabla3.set(tabla3);
    return this.sinFilas(tabla1, tabla2, tabla3);
  }
}

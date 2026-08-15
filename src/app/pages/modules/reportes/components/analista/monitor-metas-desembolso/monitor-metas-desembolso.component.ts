import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { MonitorMetasDesembolsoService } from '../../../services/analista/monitor-metas-desembolso.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { KpiMontoDesembolsado, KpiOperacionesDesembolsadas } from '../../../models/analista/monitor-metas-desembolso.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Monitor de Desembolsos" — migrado de la ruta `leg/com/rda/sec/mon-desem`
 * (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`,
 * config `rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec`
 * en `crs-map.ts`).
 *
 * No confundir con "Monitor Metas Desembolso" de `avance-comercial`
 * (`leg/com/rda/adm/mon-desem`, por jerarquía) — este es el mismo reporte
 * pero con alcance por asesor, otro `cod_rep`. Mismas 2 tarjetas KPI que la
 * versión de administración, mismo criterio de mostrarlas con el estilo fijo
 * de la tarjeta en vez de la clase CSS dinámica del legado (`style_cumpl_*`).
 */
@Component({
  selector: 'app-monitor-metas-desembolso-analista',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, SkeletonModule, TablaReporteComponent],
  templateUrl: './monitor-metas-desembolso.component.html',
  styleUrl: './monitor-metas-desembolso.component.css',
})
export class MonitorMetasDesembolsoAnalistaComponent {
  private readonly servicio = inject(MonitorMetasDesembolsoService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly mostrarFiltros = signal(false);

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
          this.mensajes.warn('Este asesor no tiene datos de desembolsos, o los datos podrían seguir procesándose.', 'Sin resultados');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

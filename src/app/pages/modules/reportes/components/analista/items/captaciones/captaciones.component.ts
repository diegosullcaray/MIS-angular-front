import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { CaptacionesService } from '../../services/captaciones.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteCaptaciones } from '../../models/captaciones.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Captaciones" — migrado de la ruta `leg/com/rda/sec/capta` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/captaciones/captacion_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-captaciones',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './captaciones.component.html',
})
export class CaptacionesComponent extends ReporteAsesorBase<ReporteCaptaciones> {
  private readonly servicio = inject(CaptacionesService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene captaciones, o los datos podrían seguir procesándose.';
  protected override readonly errorDeCarga = 'No se pudo cargar las captaciones';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerCaptaciones(this.nodoDe(asesor));
  }

  protected recibir({ tabla1, tabla2, tabla3 }: ReporteCaptaciones): boolean {
    this.tabla1.set(tabla1);
    this.tabla2.set(tabla2);
    this.tabla3.set(tabla3);
    return this.sinFilas(tabla1, tabla2, tabla3);
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { CeroCuotasService } from '../../services/cero-cuotas.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteCeroCuotas } from '../../models/cero-cuotas.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Cero Cuotas" — migrado de la ruta `leg/com/rda/sec/zu-cuo` (legado STG, título real "Cero y Una Cuota", `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/cero_cuota/cero_cuota_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-cero-cuotas',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './cero-cuotas.component.html',
})
export class CeroCuotasComponent extends ReporteAsesorBase<ReporteCeroCuotas> {
  private readonly servicio = inject(CeroCuotasService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene clientes con cero o una cuota impaga.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerCeroCuotas(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteCeroCuotas): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

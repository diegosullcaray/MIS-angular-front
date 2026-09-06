import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { AutonomiaTasasService } from '../../services/autonomia-tasas.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteAutonomiaTasas } from '../../models/autonomia-tasas.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Reporte de Autonomía de Tasas" — migrado de la ruta `leg/com/rda/sec/aut-tasa` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-autonomia-tasas',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './autonomia-tasas.component.html',
})
export class AutonomiaTasasComponent extends ReporteAsesorBase<ReporteAutonomiaTasas> {
  private readonly servicio = inject(AutonomiaTasasService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla4 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene datos de autonomía de tasas, o los datos podrían seguir procesándose.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerAutonomiaTasas(this.nodoDe(asesor));
  }

  protected recibir({ tabla1, tabla2, tabla3, tabla4 }: ReporteAutonomiaTasas): boolean {
    this.tabla1.set(tabla1);
    this.tabla2.set(tabla2);
    this.tabla3.set(tabla3);
    this.tabla4.set(tabla4);
    return this.sinFilas(tabla1, tabla2, tabla3, tabla4);
  }
}

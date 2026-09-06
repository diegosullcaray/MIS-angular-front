import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { ColocacionesDiariaService } from '../../services/colocaciones-diaria.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteColocacionesDiaria } from '../../models/colocaciones-diaria.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Colocaciones diaria Operación, Monto y Recuperación" — migrado de la ruta `leg/com/rda/sec/proy_M6` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `PROYEC_DIACOLREC_AS` en `crs-map.ts`). */
@Component({
  selector: 'app-colocaciones-diaria',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './colocaciones-diaria.component.html',
})
export class ColocacionesDiariaComponent extends ReporteAsesorBase<ReporteColocacionesDiaria> {
  private readonly servicio = inject(ColocacionesDiariaService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene datos de colocaciones, o los datos podrían seguir procesándose.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerColocacionesDiaria(this.nodoDe(asesor));
  }

  protected recibir({ tabla1, tabla2, tabla3 }: ReporteColocacionesDiaria): boolean {
    this.tabla1.set(tabla1);
    this.tabla2.set(tabla2);
    this.tabla3.set(tabla3);
    return this.sinFilas(tabla1, tabla2, tabla3);
  }
}

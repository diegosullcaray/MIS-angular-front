import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { ResumenMovilidadService } from '../../services/resumen-movilidad.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteResumenMovilidad } from '../../models/resumen-movilidad.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Resumen de Movilidad" — migrado de la ruta `leg/com/rda/sec/res-mov-sec` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `RESNMOV` en `crs-map.ts`). */
@Component({
  selector: 'app-resumen-movilidad',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './resumen-movilidad.component.html',
})
export class ResumenMovilidadComponent extends ReporteAsesorBase<ReporteResumenMovilidad> {
  private readonly servicio = inject(ResumenMovilidadService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene datos de movilidad, o los datos podrían seguir procesándose.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerResumenMovilidad(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteResumenMovilidad): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

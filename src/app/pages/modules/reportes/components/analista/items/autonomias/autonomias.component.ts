import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { AutonomiasService } from '../../services/autonomias.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteAutonomias } from '../../models/autonomias.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Autonomías" — migrado de la ruta `leg/com/rda/sec/aut` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `LST_AUT` en `crs-map.ts`). */
@Component({
  selector: 'app-autonomias',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './autonomias.component.html',
})
export class AutonomiasComponent extends ReporteAsesorBase<ReporteAutonomias> {
  private readonly servicio = inject(AutonomiasService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene datos de autonomías, o los datos podrían seguir procesándose.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerAutonomias(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteAutonomias): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

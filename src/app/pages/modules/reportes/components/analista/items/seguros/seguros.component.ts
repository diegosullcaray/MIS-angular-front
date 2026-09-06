import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { SegurosService } from '../../services/seguros.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteSeguros } from '../../models/seguros.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Seguros" — migrado de la ruta `leg/com/rda/sec/seg` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/seguros/seguros_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-seguros',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './seguros.component.html',
})
export class SegurosComponent extends ReporteAsesorBase<ReporteSeguros> {
  private readonly servicio = inject(SegurosService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene seguros registrados, o los datos podrían seguir procesándose.';
  protected override readonly errorDeCarga = 'No se pudo cargar los seguros';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerSeguros(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteSeguros): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

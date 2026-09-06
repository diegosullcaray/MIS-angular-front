import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { RecuperacionPreventivaService } from '../../services/recuperacion-preventiva.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteRecuperacionPreventiva } from '../../models/recuperacion-preventiva.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Recuperación Preventiva" — migrado de la ruta `leg/com/rda/sec/rec-prev` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/recuperacion_preventiva/recuperacion_preventiva` en `crs-map.ts`). */
@Component({
  selector: 'app-recuperacion-preventiva',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './recuperacion-preventiva.component.html',
})
export class RecuperacionPreventivaComponent extends ReporteAsesorBase<ReporteRecuperacionPreventiva> {
  private readonly servicio = inject(RecuperacionPreventivaService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Sin Recuperación Preventiva.';
  protected override readonly errorDeCarga = 'No se pudo cargar la recuperación preventiva';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerRecuperacionPreventiva(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteRecuperacionPreventiva): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

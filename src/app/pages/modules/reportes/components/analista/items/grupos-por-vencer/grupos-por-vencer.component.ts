import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { GruposPorVencerService } from '../../services/grupos-por-vencer.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteGruposPorVencer } from '../../models/grupos-por-vencer.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Grupos por Vencer" — migrado de la ruta `leg/com/rda/sec/pdm` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/grupo_pdm/grupo_pdm_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-grupos-por-vencer',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './grupos-por-vencer.component.html',
})
export class GruposPorVencerComponent extends ReporteAsesorBase<ReporteGruposPorVencer> {
  private readonly servicio = inject(GruposPorVencerService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene grupos PDM por vencer.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerGruposPorVencer(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteGruposPorVencer): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

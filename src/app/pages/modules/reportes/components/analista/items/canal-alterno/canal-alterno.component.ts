import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { CanalAlternoService } from '../../services/canal-alterno.service';
import { filtrarFilas } from '../../../../utils/reportes-mapeo.util';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteCanalAlterno } from '../../models/canal-alterno.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Canal Alterno" — migrado de la ruta `leg/com/rda/sec/canal_alt` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/canal_alt/canal_alt_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-canal-alterno',
  standalone: true,
  imports: [FormsModule, SelectModule, InputTextModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './canal-alterno.component.html',
})
export class CanalAlternoComponent extends ReporteAsesorBase<ReporteCanalAlterno> {
  private readonly servicio = inject(CanalAlternoService);

  protected readonly busqueda = signal('');

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly filasFiltradas = computed(() => filtrarFilas(this.tabla1().body, this.busqueda()));

  protected readonly avisoSinResultados = 'Este asesor no tiene canales alternativos registrados.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerCanalAlterno(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteCanalAlterno): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

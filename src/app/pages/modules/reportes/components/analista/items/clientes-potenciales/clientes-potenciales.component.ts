import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { ClientesPotencialesService } from '../../services/clientes-potenciales.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteClientesPotenciales } from '../../models/clientes-potenciales.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Clientes Potenciales" — migrado de la ruta `leg/com/rda/sec/cli_pot` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/cli_pot/cli_pot_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-clientes-potenciales',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './clientes-potenciales.component.html',
})
export class ClientesPotencialesComponent extends ReporteAsesorBase<ReporteClientesPotenciales> {
  private readonly servicio = inject(ClientesPotencialesService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene clientes potenciales registrados.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerClientesPotenciales(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteClientesPotenciales): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

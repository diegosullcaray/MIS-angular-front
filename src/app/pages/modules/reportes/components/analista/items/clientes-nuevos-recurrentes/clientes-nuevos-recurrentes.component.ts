import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { ClientesNuevosRecurrentesService } from '../../services/clientes-nuevos-recurrentes.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteClientesNuevosRecurrentes } from '../../models/clientes-nuevos-recurrentes.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Clientes Nuevos y Recurrentes" — migrado de la ruta `leg/com/rda/sec/cli-nue-rec` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/clientes_nuevos_recurrente/cliente_nuevo_rec` en `crs-map.ts`). */
@Component({
  selector: 'app-clientes-nuevos-recurrentes',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './clientes-nuevos-recurrentes.component.html',
})
export class ClientesNuevosRecurrentesComponent extends ReporteAsesorBase<ReporteClientesNuevosRecurrentes> {
  private readonly servicio = inject(ClientesNuevosRecurrentesService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene clientes nuevos ni recurrentes, o los datos podrían seguir procesándose.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerClientesNuevosRecurrentes(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteClientesNuevosRecurrentes): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

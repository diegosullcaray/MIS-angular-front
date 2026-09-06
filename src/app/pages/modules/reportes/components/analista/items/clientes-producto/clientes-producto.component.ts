import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { ClientesProductoService } from '../../services/clientes-producto.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteClientesProducto } from '../../models/clientes-producto.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Clientes Producto" — migrado de la ruta `leg/com/rda/sec/cli-prod` (legado STG, `ReportCrsV1Component`, config `rda/sectorista/cliente_producto/cliente_producto_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-clientes-producto',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './clientes-producto.component.html',
})
export class ClientesProductoComponent extends ReporteAsesorBase<ReporteClientesProducto> {
  private readonly servicio = inject(ClientesProductoService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene clientes en cartera, o los datos podrían seguir procesándose.';
  protected override readonly errorDeCarga = 'No se pudo cargar la información';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerClientesProducto(this.nodoDe(asesor));
  }

  protected recibir({ tabla1, tabla2, tabla3 }: ReporteClientesProducto): boolean {
    this.tabla1.set(tabla1);
    this.tabla2.set(tabla2);
    this.tabla3.set(tabla3);
    return this.sinFilas(tabla1, tabla2, tabla3);
  }
}

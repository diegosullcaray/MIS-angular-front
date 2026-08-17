import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteClientesProducto } from '../models/clientes-producto.model';

/**
 * Datos de "Clientes Producto" (legado `leg/com/rda/sec/cli-prod`,
 * `ReportCrsV1Component` + `crs-map.ts`:
 * `rda/sectorista/cliente_producto/cliente_producto_sec`).
 *
 * Mismo patrón que "Cartera" (solo lectura, sin `reportType` declarado en
 * `crs-map.ts` ⇒ strand deprecado `reportData`, `cod_rep` = `module` + sufijo),
 * pero con 3 bloques en vez de 2.
 */
@Injectable({ providedIn: 'root' })
export class ClientesProductoService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Clientes por producto de un asesor — 3 bloques (`..._sec_01`/`_02`/`_03`). */
  obtenerClientesProducto(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteClientesProducto> {
    return forkJoin({
      tabla1: this.reportes
        .getDeprecatedData('rda/sectorista/cliente_producto/cliente_producto_sec_01', asesor)
        .pipe(map(mapearBloqueReporte)),
      tabla2: this.reportes
        .getDeprecatedData('rda/sectorista/cliente_producto/cliente_producto_sec_02', asesor)
        .pipe(map(mapearBloqueReporte)),
      tabla3: this.reportes
        .getDeprecatedData('rda/sectorista/cliente_producto/cliente_producto_sec_03', asesor)
        .pipe(map(mapearBloqueReporte)),
    });
  }
}

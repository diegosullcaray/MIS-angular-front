import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { ReporteClientesProducto } from '../models/clientes-producto.model';
import { COD_ANALISTA_MULTIBLOQUE } from '../constantes/analista.constantes';

/** Datos de "Clientes Producto" (legado `leg/com/rda/sec/cli-prod`, `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/cliente_producto/cliente_producto_sec`). */
@Injectable({ providedIn: 'root' })
export class ClientesProductoService {
  private readonly reportes = inject(ModReportesService);

  /** Clientes por producto de un asesor — 3 bloques (`..._sec_01`/`_02`/`_03`). */
  obtenerClientesProducto(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteClientesProducto> {
    return forkJoin({
      tabla1: this.reportes
        .getDeprecatedData(COD_ANALISTA_MULTIBLOQUE.clientesProducto[0], asesor)
        .pipe(map(mapearBloqueReporte)),
      tabla2: this.reportes
        .getDeprecatedData(COD_ANALISTA_MULTIBLOQUE.clientesProducto[1], asesor)
        .pipe(map(mapearBloqueReporte)),
      tabla3: this.reportes
        .getDeprecatedData(COD_ANALISTA_MULTIBLOQUE.clientesProducto[2], asesor)
        .pipe(map(mapearBloqueReporte)),
    });
  }
}

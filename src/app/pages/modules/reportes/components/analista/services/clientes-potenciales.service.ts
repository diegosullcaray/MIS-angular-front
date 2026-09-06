import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { ReporteClientesPotenciales } from '../models/clientes-potenciales.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Clientes Potenciales" (legado `leg/com/rda/sec/cli_pot`, `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/cli_pot/cli_pot_sec`). */
@Injectable({ providedIn: 'root' })
export class ClientesPotencialesService {
  private readonly reportes = inject(ModReportesService);

  /** Clientes potenciales de un asesor — único bloque (`cli_pot_sec_01`). */
  obtenerClientesPotenciales(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteClientesPotenciales> {
    return this.reportes
      .getDeprecatedData(COD_ANALISTA.clientesPotenciales, asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

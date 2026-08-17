import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteClientesPotenciales } from '../models/clientes-potenciales.model';

/**
 * Datos de "Clientes Potenciales" (legado `leg/com/rda/sec/cli_pot`,
 * `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/cli_pot/cli_pot_sec`).
 *
 * Mismo patrón que "Cartera"/"Canal Alterno" (solo lectura, sin `reportType`
 * declarado en `crs-map.ts` ⇒ strand deprecado `reportData`, `cod_rep` =
 * `module` + sufijo), con un único bloque.
 */
@Injectable({ providedIn: 'root' })
export class ClientesPotencialesService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Clientes potenciales de un asesor — único bloque (`cli_pot_sec_01`). */
  obtenerClientesPotenciales(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteClientesPotenciales> {
    return this.reportes
      .getDeprecatedData('rda/sectorista/cli_pot/cli_pot_sec_01', asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

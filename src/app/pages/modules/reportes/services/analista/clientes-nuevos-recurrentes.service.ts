import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../../models/analista/asesor-sec.model';
import type { ReporteClientesNuevosRecurrentes } from '../../models/analista/clientes-nuevos-recurrentes.model';

/**
 * Datos de "Clientes Nuevos y Recurrentes" (legado `leg/com/rda/sec/cli-nue-rec`,
 * `ReportCrsV1Component` + `crs-map.ts`:
 * `rda/sectorista/clientes_nuevos_recurrente/cliente_nuevo_rec`).
 *
 * Mismo patrón que "Cartera"/"Clientes Producto" (solo lectura, sin
 * `reportType` declarado en `crs-map.ts` ⇒ strand deprecado `reportData`,
 * `cod_rep` = `module` + sufijo), pero con un único bloque (`_01`).
 */
@Injectable({ providedIn: 'root' })
export class ClientesNuevosRecurrentesService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Clientes nuevos y recurrentes de un asesor — único bloque (`cliente_nuevo_rec_01`). */
  obtenerClientesNuevosRecurrentes(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteClientesNuevosRecurrentes> {
    return this.reportes
      .getDeprecatedData('rda/sectorista/clientes_nuevos_recurrente/cliente_nuevo_rec_01', asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

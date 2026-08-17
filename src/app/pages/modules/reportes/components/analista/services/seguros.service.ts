import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../../models/analista/asesor-sec.model';
import type { ReporteSeguros } from '../../models/analista/seguros.model';

/**
 * Datos de "Seguros" (legado `leg/com/rda/sec/seg`, `ReportCrsV1Component` +
 * `crs-map.ts`: `rda/sectorista/seguros/seguros_sec`).
 *
 * Mismo patrón que "Cartera"/"Clientes Nuevos y Recurrentes" (solo lectura,
 * sin `reportType` declarado en `crs-map.ts` ⇒ strand deprecado `reportData`,
 * `cod_rep` = `module` + sufijo), con un único bloque.
 */
@Injectable({ providedIn: 'root' })
export class SegurosService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Seguros de un asesor — único bloque (`seguros_sec_01`). */
  obtenerSeguros(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteSeguros> {
    return this.reportes
      .getDeprecatedData('rda/sectorista/seguros/seguros_sec_01', asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/analista/asesor-sec.model';
import type { ReporteRecuperacionPreventiva } from '../models/analista/recuperacion-preventiva.model';

/**
 * Datos de "Recuperación Preventiva" (legado `leg/com/rda/sec/rec-prev`,
 * `ReportCrsV1Component` + `crs-map.ts`:
 * `rda/sectorista/recuperacion_preventiva/recuperacion_preventiva`).
 *
 * Mismo patrón que "Cartera"/"Seguros" (solo lectura, sin `reportType`
 * declarado en `crs-map.ts` ⇒ strand deprecado `reportData`, `cod_rep` =
 * `module` + sufijo), con un único bloque.
 */
@Injectable({ providedIn: 'root' })
export class RecuperacionPreventivaService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Créditos en recuperación preventiva de un asesor — único bloque (`recuperacion_preventiva_01`). */
  obtenerRecuperacionPreventiva(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteRecuperacionPreventiva> {
    return this.reportes
      .getDeprecatedData('rda/sectorista/recuperacion_preventiva/recuperacion_preventiva_01', asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

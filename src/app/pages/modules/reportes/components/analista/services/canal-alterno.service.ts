import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteCanalAlterno } from '../models/canal-alterno.model';

/**
 * Datos de "Canal Alterno" (legado `leg/com/rda/sec/canal_alt`,
 * `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/canal_alt/canal_alt_sec`).
 *
 * Mismo patrón que "Cartera"/"Cero Cuotas" (solo lectura, sin `reportType`
 * declarado en `crs-map.ts` ⇒ strand deprecado `reportData`, `cod_rep` =
 * `module` + sufijo), con un único bloque.
 */
@Injectable({ providedIn: 'root' })
export class CanalAlternoService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Canales alternativos de atención de un asesor — único bloque (`canal_alt_sec_01`). */
  obtenerCanalAlterno(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteCanalAlterno> {
    return this.reportes
      .getDeprecatedData('rda/sectorista/canal_alt/canal_alt_sec_01', asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

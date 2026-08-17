import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteCaptaciones } from '../models/captaciones.model';

/**
 * Datos de "Captaciones" (legado `leg/com/rda/sec/capta`,
 * `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/captaciones/captacion_sec`).
 *
 * Mismo patrón que "Cartera"/"Clientes Producto" (solo lectura, sin
 * `reportType` declarado en `crs-map.ts` ⇒ strand deprecado `reportData`,
 * `cod_rep` = `module` + sufijo), con 3 bloques — el tercero es "Ahorro
 * Programado" (`content.higher` del legado).
 */
@Injectable({ providedIn: 'root' })
export class CaptacionesService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Captaciones de un asesor — 3 bloques (`..._sec_01`/`_02`/`_03`). */
  obtenerCaptaciones(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteCaptaciones> {
    return forkJoin({
      tabla1: this.reportes.getDeprecatedData('rda/sectorista/captaciones/captacion_sec_01', asesor).pipe(map(mapearBloqueReporte)),
      tabla2: this.reportes.getDeprecatedData('rda/sectorista/captaciones/captacion_sec_02', asesor).pipe(map(mapearBloqueReporte)),
      tabla3: this.reportes.getDeprecatedData('rda/sectorista/captaciones/captacion_sec_03', asesor).pipe(map(mapearBloqueReporte)),
    });
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../../models/analista/asesor-sec.model';
import type { ReporteCampanaAgil } from '../../models/analista/campana-agil.model';

/**
 * Datos de "Campaña Ágil" (legado `leg/com/rda/sec/cam-agl`,
 * `ReportCrsV1Component` + `crs-map.ts`:
 * `rda/sectorista/campania_agil/campana_agil_sec`).
 *
 * Mismo patrón que "Cartera"/"Cero Cuotas" (solo lectura, sin `reportType`
 * declarado en `crs-map.ts` ⇒ strand deprecado `reportData`, `cod_rep` =
 * `module` + sufijo), único bloque, pero con un filtro real (`Semana01()`
 * en `crs-map.ts` → variable `sem`) — a diferencia de los filtros muertos
 * vistos en otros reportes bespoke, acá sí se renderiza (`ReportCrsV1Component`
 * sí pinta `report.getFilters()` vía `app-select-multiple`).
 */
@Injectable({ providedIn: 'root' })
export class CampanaAgilService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Campaña ágil de un asesor para una semana — único bloque (`campana_agil_sec_01`). */
  obtenerCampanaAgil(asesor: { tip_cod: number; cod_rel: string }, semana: number): Observable<ReporteCampanaAgil> {
    return this.reportes
      .getDeprecatedData('rda/sectorista/campania_agil/campana_agil_sec_01', { ...asesor, sem: semana })
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteGruposPorVencer } from '../models/grupos-por-vencer.model';

/**
 * Datos de "Grupos por Vencer" (legado `leg/com/rda/sec/pdm`,
 * `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/grupo_pdm/grupo_pdm_sec`).
 *
 * Mismo patrón que "Cartera"/"Cero Cuotas" (solo lectura, sin `reportType`
 * declarado en `crs-map.ts` ⇒ strand deprecado `reportData`, `cod_rep` =
 * `module` + sufijo), con un único bloque.
 */
@Injectable({ providedIn: 'root' })
export class GruposPorVencerService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Grupos PDM por vencer de un asesor — único bloque (`grupo_pdm_sec_01`). */
  obtenerGruposPorVencer(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteGruposPorVencer> {
    return this.reportes
      .getDeprecatedData('rda/sectorista/grupo_pdm/grupo_pdm_sec_01', asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

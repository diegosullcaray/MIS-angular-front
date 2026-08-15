import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/analista/asesor-sec.model';
import type { ReporteAutonomiaTasas } from '../models/analista/autonomia-tasas.model';

/**
 * Datos de "Reporte de Autonomía de Tasas" (legado `leg/com/rda/sec/aut-tasa`,
 * `ReportCrsV1Component` + `crs-map.ts`:
 * `rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec`).
 *
 * Mismo patrón que "Cartera"/"Cero Cuotas" (solo lectura, sin `reportType`
 * declarado en `crs-map.ts` ⇒ strand deprecado `reportData`, `cod_rep` =
 * `module` + sufijo), con 4 bloques — cada uno lleva un parámetro fijo `var`
 * distinto (`crs-map.ts`: `_01→"4"`, `_02→"1"`, `_03→"3"`, `_04→"2"`).
 */
@Injectable({ providedIn: 'root' })
export class AutonomiaTasasService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Autonomía de tasas de un asesor — 4 bloques, cada uno con su propio `var` fijo. */
  obtenerAutonomiaTasas(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteAutonomiaTasas> {
    const modulo = 'rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec';
    return forkJoin({
      tabla1: this.reportes.getDeprecatedData(`${modulo}_01`, { ...asesor, var: '4' }).pipe(map(mapearBloqueReporte)),
      tabla2: this.reportes.getDeprecatedData(`${modulo}_02`, { ...asesor, var: '1' }).pipe(map(mapearBloqueReporte)),
      tabla3: this.reportes.getDeprecatedData(`${modulo}_03`, { ...asesor, var: '3' }).pipe(map(mapearBloqueReporte)),
      tabla4: this.reportes.getDeprecatedData(`${modulo}_04`, { ...asesor, var: '2' }).pipe(map(mapearBloqueReporte)),
    });
  }
}

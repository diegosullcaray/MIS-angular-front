import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/analista/asesor-sec.model';
import type { ReporteCartera } from '../models/analista/cartera.model';

/**
 * Datos de "Cartera" (legado `leg/com/rda/sec/cartera`,
 * `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/cartera/cartera_sec`).
 *
 * A diferencia de "Encuesta Clientes"/"Clientes Reprogramados"/"Datos
 * Clientes", este reporte es de solo lectura (sin formulario ni guardado) y
 * el `cod_rep` real es el propio `module` del legado + sufijo (`_01`/`_02`),
 * no un código corto — así arma `ReportT.getRNameCompleted()`. Además esta
 * entrada de `crs-map.ts` no declara `reportType`, así que el legado la
 * manda por el strand "deprecado" (`reportData`), no `regularData` — ver
 * `ModReportesService.getDeprecatedData()`.
 */
@Injectable({ providedIn: 'root' })
export class CarteraService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Cartera de un asesor — 2 bloques (`rda/sectorista/cartera/cartera_sec_01`/`_02`). */
  obtenerCartera(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteCartera> {
    return forkJoin({
      tabla1: this.reportes.getDeprecatedData('rda/sectorista/cartera/cartera_sec_01', asesor).pipe(map(mapearBloqueReporte)),
      tabla2: this.reportes.getDeprecatedData('rda/sectorista/cartera/cartera_sec_02', asesor).pipe(map(mapearBloqueReporte)),
    });
  }
}

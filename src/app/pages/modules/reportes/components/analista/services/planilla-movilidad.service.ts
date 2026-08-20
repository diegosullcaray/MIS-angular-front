import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import { fechaUltimoDia } from '../../../utils/fecha-reporte.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import { TABLA_VACIA } from '../../../models/tabla-reporte.model';
import type { ReportePlanillaMovilidad } from '../models/planilla-movilidad.model';

/** Datos de "Planilla de Movilidad" (legado `leg/com/rda/sec/plan-mov-sec`, `ReportCrsv5Component` + `crs-map.ts`: `PLANMOV`). */
@Injectable({ providedIn: 'root' })
export class PlanillaMovilidadService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Planilla de movilidad de un asesor — 4 bloques (`PLANMOV_01/_02/_03/_04`), cada uno tolerante a fallas propias. */
  obtenerPlanillaMovilidad(asesor: { tip_cod: number; cod_rel: string }): Observable<ReportePlanillaMovilidad> {
    const params = { ...asesor, fec: fechaUltimoDia() };
    const pedirBloque = (codRep: string) =>
      this.reportes.getRegularData(codRep, params).pipe(
        map(mapearBloqueReporte),
        catchError(() => {
          return of(TABLA_VACIA);
        })
      );
    return forkJoin({
      tabla1: pedirBloque('PLANMOV_01'),
      tabla2: pedirBloque('PLANMOV_02'),
      tabla3: pedirBloque('PLANMOV_03'),
      tabla4: pedirBloque('PLANMOV_04'),
    });
  }
}

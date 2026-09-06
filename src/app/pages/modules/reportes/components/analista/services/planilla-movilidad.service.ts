import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import { fechaUltimoDia } from '../../../utils/fecha-reporte.util';
import { TABLA_VACIA } from '../../../models/tabla-reporte.model';
import type { ReportePlanillaMovilidad } from '../models/planilla-movilidad.model';
import { COD_ANALISTA_MULTIBLOQUE } from '../constantes/analista.constantes';

/** Datos de "Planilla de Movilidad" (legado `leg/com/rda/sec/plan-mov-sec`, `ReportCrsv5Component` + `crs-map.ts`: `PLANMOV`). */
@Injectable({ providedIn: 'root' })
export class PlanillaMovilidadService {
  private readonly reportes = inject(ModReportesService);

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
      tabla1: pedirBloque(COD_ANALISTA_MULTIBLOQUE.planillaMovilidad[0]),
      tabla2: pedirBloque(COD_ANALISTA_MULTIBLOQUE.planillaMovilidad[1]),
      tabla3: pedirBloque(COD_ANALISTA_MULTIBLOQUE.planillaMovilidad[2]),
      tabla4: pedirBloque(COD_ANALISTA_MULTIBLOQUE.planillaMovilidad[3]),
    });
  }
}

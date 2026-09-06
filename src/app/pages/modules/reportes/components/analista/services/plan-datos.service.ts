import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { ReportePlanDatos } from '../models/plan-datos.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Plan de Datos" (legado `leg/com/rda/sec/plan-datos-sec`, `ReportCrsV1Component` + `crs-map.ts`: `P_Datos`). */
@Injectable({ providedIn: 'root' })
export class PlanDatosService {
  private readonly reportes = inject(ModReportesService);

  /** Plan de datos de un asesor para una fecha base — único bloque (`P_Datos_02`). */
  obtenerPlanDatos(asesor: { tip_cod: number; cod_rel: string }, fechaBase: string): Observable<ReportePlanDatos> {
    return this.reportes
      .getRegularData(COD_ANALISTA.planDatos, { ...asesor, fec: fechaBase })
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

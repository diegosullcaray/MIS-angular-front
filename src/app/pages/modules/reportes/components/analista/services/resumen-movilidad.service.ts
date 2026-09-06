import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { ReporteResumenMovilidad } from '../models/resumen-movilidad.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Resumen de Movilidad" (legado `leg/com/rda/sec/res-mov-sec`, `ReportCrsV1Component` + `crs-map.ts`: `RESNMOV`). */
@Injectable({ providedIn: 'root' })
export class ResumenMovilidadService {
  private readonly reportes = inject(ModReportesService);

  /** Resumen de movilidad de un asesor — único bloque (`RESNMOV_02`). */
  obtenerResumenMovilidad(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteResumenMovilidad> {
    return this.reportes
      .getRegularData(COD_ANALISTA.resumenMovilidad, asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

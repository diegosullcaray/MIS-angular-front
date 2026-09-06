import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { ReporteAutonomias } from '../models/autonomias.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Autonomías" (legado `leg/com/rda/sec/aut`, `ReportCrsV1Component` + `crs-map.ts`: `LST_AUT`). */
@Injectable({ providedIn: 'root' })
export class AutonomiasService {
  private readonly reportes = inject(ModReportesService);

  /** Autonomías de un asesor — único bloque (`LST_AUT_01`). */
  obtenerAutonomias(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteAutonomias> {
    return this.reportes
      .getRegularData(COD_ANALISTA.autonomias, { ...asesor, c_aut: 3, aut: 2 })
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

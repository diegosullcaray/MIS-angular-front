import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { ReporteDesempenoSocialAnalista } from '../models/desempeno-social-analista.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Desempeño Social" de analista/sectorista (legado `leg/com/rda/sec/desempeno-social-as`, `ReportCrsV1Component` + `crs-map.ts`: `DESE_SOC_AS`). */
@Injectable({ providedIn: 'root' })
export class DesempenoSocialAnalistaService {
  private readonly reportes = inject(ModReportesService);

  /** Desempeño social de un asesor — único bloque (`DESE_SOC_AS_01`). */
  obtenerDesempenoSocial(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteDesempenoSocialAnalista> {
    return this.reportes
      .getRegularData(COD_ANALISTA.desempenoSocial, asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

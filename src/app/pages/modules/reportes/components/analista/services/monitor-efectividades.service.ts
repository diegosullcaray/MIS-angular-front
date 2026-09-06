import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { FiltrosMonitorEfectividades, ReporteMonitorEfectividades } from '../models/monitor-efectividades.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Detalle Monitor de Efectividades Asesor" (legado `leg/com/rda/sec/mon_efec_sec`, `ReportCrsV3Component` + `crs-map.ts`: `RS_MON_EFEC_SEC`). */
@Injectable({ providedIn: 'root' })
export class MonitorEfectividadesService {
  private readonly reportes = inject(ModReportesService);

  /** Efectividades de un asesor con los 6 filtros aplicados — único bloque (`RS_MON_EFEC_SEC_01`). */
  obtenerMonitorEfectividades(
    asesor: { tip_cod: number; cod_rel: string },
    filtros: FiltrosMonitorEfectividades
  ): Observable<ReporteMonitorEfectividades> {
    return this.reportes
      .getRegularData(COD_ANALISTA.monitorEfectividades, { ...asesor, ...filtros, pagen: 1 })
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

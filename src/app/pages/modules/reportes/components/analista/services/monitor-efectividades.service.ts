import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { FiltrosMonitorEfectividades, ReporteMonitorEfectividades } from '../models/monitor-efectividades.model';

/** Datos de "Detalle Monitor de Efectividades Asesor" (legado `leg/com/rda/sec/mon_efec_sec`, `ReportCrsV3Component` + `crs-map.ts`: `RS_MON_EFEC_SEC`). */
@Injectable({ providedIn: 'root' })
export class MonitorEfectividadesService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Efectividades de un asesor con los 6 filtros aplicados — único bloque (`RS_MON_EFEC_SEC_01`). */
  obtenerMonitorEfectividades(
    asesor: { tip_cod: number; cod_rel: string },
    filtros: FiltrosMonitorEfectividades
  ): Observable<ReporteMonitorEfectividades> {
    return this.reportes
      .getRegularData('RS_MON_EFEC_SEC_01', { ...asesor, ...filtros, pagen: 1 })
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}

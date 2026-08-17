import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { FiltrosMonitorEfectividades, ReporteMonitorEfectividades } from '../models/monitor-efectividades.model';

/**
 * Datos de "Detalle Monitor de Efectividades Asesor" (legado
 * `leg/com/rda/sec/mon_efec_sec`, `ReportCrsV3Component` + `crs-map.ts`:
 * `RS_MON_EFEC_SEC`).
 *
 * `ReportCrsV3Component` agrega paginación AJAX (`app-table-ajax`) y un
 * select "Última Gestión" sobre el legado V1, pero ambos están inactivos acá:
 * la paginación no se migra (mismo criterio que el resto de `reportes`, ver
 * `tabla-reporte.component.ts`) y el select "Última Gestión" nunca se activa
 * (`rendererFilterT()` está comentado en `ngOnInit()` del legado) — en la
 * práctica se comporta igual que un reporte V1 con filtros.
 *
 * `reportType: ReportType.REGULAR` en `crs-map.ts` ⇒ strand moderno
 * `regularData`, con 6 filtros reales (`Tramo01()`, `Producto01()`,
 * `Boolean01()` x3, `TramoVenc01()`).
 *
 * El legado manda además un parámetro fijo `pagen: 1` (`ReportCrsV3Component.ngOnInit()`:
 * `this.page$.next({ pagen: 1 })`, mezclado en cada `renderTable()` vía
 * `mergeParams()`) — sin paginación real acá, pero el backend de este reporte
 * en particular lo espera para no fallar (confirmado: sin `pagen` responde 500).
 */
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

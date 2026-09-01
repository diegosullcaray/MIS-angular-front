import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type {
  KpiMontoDesembolsado,
  KpiOperacionesDesembolsadas,
  ReporteMonitorMetasDesembolso,
} from '../models/monitor-metas-desembolso.model';
import { COD_ANALISTA_MULTIBLOQUE } from '../constantes/analista.constantes';

/** Datos de "Monitor de Desembolsos" (legado `leg/com/rda/sec/mon-desem`, `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec`). */
@Injectable({ providedIn: 'root' })
export class MonitorMetasDesembolsoService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Monitor de desembolsos de un asesor — 3 bloques (`..._sec_01`/`_02`/`_03`). */
  obtenerMonitorMetasDesembolso(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteMonitorMetasDesembolso> {
    return forkJoin({
      t1: this.reportes
        .getDeprecatedData(COD_ANALISTA_MULTIBLOQUE.monitorMetasDesembolso[0], { ...asesor, tipmet: 1 })
        .pipe(map(mapearBloqueReporte)),
      t2: this.reportes
        .getDeprecatedData(COD_ANALISTA_MULTIBLOQUE.monitorMetasDesembolso[1], { ...asesor, tipmet: 1 })
        .pipe(map(mapearBloqueReporte)),
      t3: this.reportes
        .getDeprecatedData(COD_ANALISTA_MULTIBLOQUE.monitorMetasDesembolso[2], asesor)
        .pipe(map(mapearBloqueReporte)),
    }).pipe(
      map(({ t1, t2, t3 }) => ({
        kpiOperaciones: (t1.additional as unknown as KpiOperacionesDesembolsadas | undefined) ?? null,
        kpiMonto: (t2.additional as unknown as KpiMontoDesembolsado | undefined) ?? null,
        tabla1: t1,
        tabla2: t2,
        tabla3: t3,
      }))
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../../models/analista/asesor-sec.model';
import type {
  KpiMontoDesembolsado,
  KpiOperacionesDesembolsadas,
  ReporteMonitorMetasDesembolso,
} from '../../models/analista/monitor-metas-desembolso.model';

/**
 * Datos de "Monitor de Desembolsos" (legado `leg/com/rda/sec/mon-desem`,
 * `ReportCrsV1Component` + `crs-map.ts`:
 * `rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec`).
 *
 * No confundir con "Monitor Metas Desembolso" de `avance-comercial`
 * (`rda/administracion`, `cod_rep: 'Monitor_Dese'`, por jerarquía) — es un
 * reporte distinto del legado, con su propio `cod_rep` y alcance por asesor
 * en vez de por nivel de jerarquía; ambos comparten la misma estructura de
 * tarjetas KPI + tablas.
 *
 * Los bloques `_01`/`_02` llevan el parámetro fijo `tipmet: 1`
 * (`crs-map.ts`); su `additional` trae los datos de las tarjetas KPI
 * ("Operaciones Desembolsadas"/"Monto Desembolsado", ambas con
 * "Cumplimiento de Meta") — mismo mecanismo que el legado
 * (`TableMHService.addExt()`) usa para sustituir `:$campo` en el HTML de
 * `content.higher`, acá simplemente se muestra el valor con el estilo fijo
 * de la tarjeta en vez de parsear la clase CSS dinámica del legado
 * (`style_cumpl_*`), igual que ya se resolvió en la versión de administración
 * (`AvanceComercialService.obtenerMonitorMetasDesembolso`).
 */
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
        .getDeprecatedData('rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_01', { ...asesor, tipmet: 1 })
        .pipe(map(mapearBloqueReporte)),
      t2: this.reportes
        .getDeprecatedData('rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_02', { ...asesor, tipmet: 1 })
        .pipe(map(mapearBloqueReporte)),
      t3: this.reportes
        .getDeprecatedData('rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_03', asesor)
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

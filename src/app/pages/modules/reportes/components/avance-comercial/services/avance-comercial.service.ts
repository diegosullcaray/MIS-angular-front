import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import { fechaUltimoDia } from '../../../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { KpiMontoDesembolsado, KpiOperacionesDesembolsadas, ReporteMonitorMetasDesembolso } from '../models/avance-comercial.model';
import { COD_AVANCE_COMERCIAL } from '../constantes/avance-comercial.constantes';

/** Datos de los reportes del dominio "Avance Comercial": Monitor Metas Desembolso y Monitor Reprogramados. */
@Injectable({ providedIn: 'root' })
export class AvanceComercialService {
  private readonly ant = inject(ModReportesService);

  /** "Monitor Metas Desembolso" (`Monitor_Dese_01..04`) para un nivel de jerarquía. */
  obtenerMonitorMetasDesembolso(nivel: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>): Observable<ReporteMonitorMetasDesembolso> {
    return forkJoin({
      t1: this.ant.getRegularData(COD_AVANCE_COMERCIAL.monitorMetasDesembolso[0], { ...nivel, tipmet: 1 }).pipe(map(mapearBloqueReporte)),
      t2: this.ant.getRegularData(COD_AVANCE_COMERCIAL.monitorMetasDesembolso[1], { ...nivel, tipmet: 1 }).pipe(map(mapearBloqueReporte)),
      t3: this.ant.getRegularData(COD_AVANCE_COMERCIAL.monitorMetasDesembolso[2], { ...nivel, tipmet: 1 }).pipe(map(mapearBloqueReporte)),
      t4: this.ant.getRegularData(COD_AVANCE_COMERCIAL.monitorMetasDesembolso[3], nivel).pipe(map(mapearBloqueReporte)),
    }).pipe(
      map(({ t1, t2, t3, t4 }) => ({
        kpiOperaciones: (t1.additional as unknown as KpiOperacionesDesembolsadas | undefined) ?? null,
        kpiMonto: (t2.additional as unknown as KpiMontoDesembolsado | undefined) ?? null,
        tabla1: t1,
        tabla2: t2,
        tabla3: t3,
        tabla4: t4,
      }))
    );
  }

  /** "Monitor Reprogramados" (`RS_MON_REP_01`) para un nivel de jerarquía + tipo (operaciones/saldo). */
  obtenerMonitorReprogramados(nivel: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>, tipo: 1 | 2): Observable<TablaReporteResultado> {
    return this.ant
      .getRegularData(COD_AVANCE_COMERCIAL.monitorReprogramados, {
        tip_cod: nivel.tip_cod,
        cod_rel: nivel.cod_rel,
        car: tipo,
        fec: fechaUltimoDia(),
      })
      .pipe(map(mapearBloqueReporte));
  }
}

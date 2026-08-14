import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { mapearBloqueReporte, mapearTablaRegular } from '../utils/reportes-mapeo.util';
import { fechaCorte, fechaUltimoDia } from '../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../models/jerarquia.model';
import type { TablaReporteResultado } from '../models/tabla-reporte.model';
import type {
  ReporteMonitorProductosMisionales,
  ReportePoblacionMisional,
  ReporteProductosMisionales,
} from '../models/desarrollo-sostenible/desarrollo-sostenible.model';
import type { KpiOperacionesDesembolsadas } from '../models/avance-comercial/avance-comercial.model';

/**
 * Datos de los reportes del dominio "Desarrollo Sostenible": Monitor
 * Productos Misionales, Desempeño Social, Productos Misionales y
 * Poblaciones Misionales.
 */
@Injectable({ providedIn: 'root' })
export class DesarrolloSostenibleService {
  private readonly ant = inject(ModReportesService);
  private readonly shell = inject(ShellStateService);

  /** "Monitor Productos Misionales" (`Monitor_Dese_misi_01/_02`) para un nivel de jerarquía + producto. */
  obtenerMonitorProductosMisionales(
    nivel: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>,
    prod: string
  ): Observable<ReporteMonitorProductosMisionales> {
    const params = { ...nivel, prod, tipmet: 1 };

    return forkJoin({
      simple: this.ant.getRegularData('Monitor_Dese_misi_02', params).pipe(map(mapearBloqueReporte)),
      kpi: this.ant.getRegularData('Monitor_Dese_misi_01', params).pipe(map(mapearBloqueReporte)),
    }).pipe(
      map(({ simple, kpi }) => ({
        kpiOperaciones: (kpi.additional as unknown as KpiOperacionesDesembolsadas | undefined) ?? null,
        tablaSimple: simple,
      }))
    );
  }

  /** "Desempeño Social" (`DESEMP_SOC_01`) para un nivel de jerarquía. */
  obtenerDesempenoSocial(nivel: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>): Observable<TablaReporteResultado> {
    return this.ant
      .getRegularData('DESEMP_SOC_01', { tip_cod: nivel.tip_cod, cod_rel: nivel.cod_rel, fec: fechaUltimoDia() })
      .pipe(map(mapearBloqueReporte));
  }

  /**
   * "Productos Misionales" (`prod_misi_01..05`) para un nivel de jerarquía +
   * producto — mapeo tabla↔bloque confirmado leyendo el legado completo
   * (`panel-misionales.component.ts`/`.html`): resumen=`_05`, territorio=`_04`,
   * corredores=`_01`, unidad=`_02`, asesores=`_03`.
   */
  obtenerProductosMisionales(nivel: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>, prod: string): Observable<ReporteProductosMisionales> {
    const params = { tip_cod: nivel.tip_cod, cod_rel: nivel.cod_rel, fec: fechaCorte(this.shell.usuarioActivo()?.fechaCorte), prod };

    return forkJoin({
      resumen: this.ant.getRegularTableResult('prod_misi_05', params).pipe(map(mapearTablaRegular)),
      territorio: this.ant.getRegularTableResult('prod_misi_04', params).pipe(map(mapearTablaRegular)),
      corredores: this.ant.getRegularTableResult('prod_misi_01', params).pipe(map(mapearTablaRegular)),
      unidad: this.ant.getRegularTableResult('prod_misi_02', params).pipe(map(mapearTablaRegular)),
      asesores: this.ant.getRegularTableResult('prod_misi_03', params).pipe(map(mapearTablaRegular)),
    });
  }

  /** "Poblaciones Misionales" (`pob_misi_01..04`) para un nivel de jerarquía + población. */
  obtenerPoblacionMisional(nivel: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>, prod: string): Observable<ReportePoblacionMisional> {
    const params = { tip_cod: nivel.tip_cod, cod_rel: nivel.cod_rel, fec: fechaCorte(this.shell.usuarioActivo()?.fechaCorte), prod };

    return forkJoin({
      territorio: this.ant.getRegularTableResult('pob_misi_01', params).pipe(map(mapearTablaRegular)),
      corredores: this.ant.getRegularTableResult('pob_misi_02', params).pipe(map(mapearTablaRegular)),
      unidad: this.ant.getRegularTableResult('pob_misi_03', params).pipe(map(mapearTablaRegular)),
      asesores: this.ant.getRegularTableResult('pob_misi_04', params).pipe(map(mapearTablaRegular)),
    });
  }
}

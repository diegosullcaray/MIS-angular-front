import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { mapearBloqueReporte, mapearTablaRegular } from '../utils/reportes-mapeo.util';
import { fechaCorte, fechaUltimoDia } from '../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../models/jerarquia.model';
import type { ColumnaReporte, TablaReporteResultado } from '../models/tabla-reporte.model';
import type {
  ReporteMonitorProductosMisionales,
  ReportePoblacionMisional,
  ReporteProductosMisionales,
} from '../models/desarrollo-sostenible/desarrollo-sostenible.model';
import type { KpiOperacionesDesembolsadas } from '../models/avance-comercial/avance-comercial.model';

/**
 * `DESEMP_SOC_01` ata cada semáforo oculto a la columna que le SIGUE en el
 * arreglo, no a la que tiene delante: el semáforo pegado a "META" (`col_8`)
 * en realidad colorea "TMM"; el pegado a "TMM" (`col_10`) colorea "TAM" — y
 * "META" nunca tiene semáforo propio (confirmado contra el legado). Se
 * reordena la fila de encabezado nivel 1 para que cada semáforo quede junto
 * a la columna de valor que de verdad colorea.
 */
export function corregirSemaforosDesempenoSocial(resultado: TablaReporteResultado): TablaReporteResultado {
  const filaNivel1 = resultado.headers[0];
  if (!filaNivel1) return resultado;

  const porDef = new Map(filaNivel1.columns.map((c) => [c.columnDef, c] as const));
  const meta = porDef.get('col_7');
  const semMeta = porDef.get('col_8');
  const tmm = porDef.get('col_9');
  const semTmm = porDef.get('col_10');
  const tam = porDef.get('col_11');
  const semTam = porDef.get('col_12');
  const distanciaMeta = porDef.get('col_13');
  if (!meta || !semMeta || !tmm || !semTmm || !tam || !semTam || !distanciaMeta) return resultado;

  const encabezado: ColumnaReporte[] = [
    ...filaNivel1.columns.slice(0, filaNivel1.columns.indexOf(meta)), // DESVAL, "2025", "2026"
    { ...meta, cols: 1, isdata: 8 },
    { ...tmm, cols: 2, isdata: 9 },
    { ...semMeta, isdata: 10 }, // el semáforo de "META" es en realidad el de "TMM"
    { ...tam, cols: 2, isdata: 11 },
    { ...semTmm, isdata: 12 }, // el de "TMM" es en realidad el de "TAM"
    { ...distanciaMeta, cols: 2, isdata: 13 },
    { ...semTam, isdata: 14 }, // el de "TAM" queda como semáforo (vacío, sin dato del backend) de "Distancia Meta"
  ];

  return { ...resultado, headers: [{ ...filaNivel1, columns: encabezado }, ...resultado.headers.slice(1)] };
}

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
        tablaDetalle: kpi,
        tablaSimple: simple,
      }))
    );
  }

  /** "Desempeño Social" (`DESEMP_SOC_01`) para un nivel de jerarquía. */
  obtenerDesempenoSocial(nivel: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>): Observable<TablaReporteResultado> {
    return this.ant
      .getRegularData('DESEMP_SOC_01', { tip_cod: nivel.tip_cod, cod_rel: nivel.cod_rel, fec: fechaUltimoDia() })
      .pipe(map(mapearBloqueReporte), map(corregirSemaforosDesempenoSocial));
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

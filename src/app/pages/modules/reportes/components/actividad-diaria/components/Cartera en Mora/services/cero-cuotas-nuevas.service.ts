import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloquesGrafico } from '../../../../../utils/reportes-mapeo.util';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { IWinderResponse } from '../../../../../../../../core/winder/winder/winder.interface';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';

/** Cortes para Top. */
const CORTES_TOP = [
  { tip_cod2: '20', etiqueta: 'Territorio' },
  { tip_cod2: '18', etiqueta: 'Unidad' },
] as const;

/** Servicios para reportes de Cero Cuotas Nuevas. */
@Injectable({ providedIn: 'root' })
export class CeroCuotasNuevasService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Dashboard de Cero Cuotas Nuevas. */
  dashboard(nodo: NodoConsulta): Observable<BloqueGrafico[]> {
    return this.reportes
      .getGraphicData('rda/administracion/mora/Dashboard_rda_01', {
        tip_cod: nodo.tip_cod,
        cod_rel: nodo.cod_rel,
        fec: this.bloques.fec(),
      })
      .pipe(map(mapearBloquesGrafico));
  }

  /** Cuadro de Mando. */
  cuadroMando(nodo: NodoConsulta, filtros: Record<string, unknown>): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      ['_01', '_02'].map((id) => ({ codRep: `CMCUONUEV${id}`, extra: filtros })),
      nodo,
    );
  }

  /** Reporte Top. */
  top(nodo: NodoConsulta, filtros: Record<string, unknown>): Observable<TablaReporteResultado[]> {
    const bloques = ['_01', '_02', '_03', '_04', '_05'].flatMap((id) =>
      CORTES_TOP.map((corte) => ({
        codRep: `CEROCUOTA_TOPCNUEVA${id}`,
        extra: { tip_cod2: corte.tip_cod2, ...filtros },
      })),
    );
    return this.bloques.regulares(bloques, nodo);
  }

  /** Base de Gestión. */
  baseGestion(nodo: NodoConsulta, filtros: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado('LCCUOTANUEVA_01', nodo, filtros).pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Dashboard en Revisión. */
  dashboardRevision(nodo: NodoConsulta): Observable<BloqueGrafico[]> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fecha: this.bloques.fecha() };
    return forkJoin([
      this.reportes.getRegularTableResult('REP_CERCUOT_01', params),
      this.reportes.getRegularTableResult('REP_CERCUOT_02', params),
    ]).pipe(
      map(([r01, r02]) => {
        const f01 = filasDe(r01);
        const f02 = filasDe(r02);
        return [
          grafico('Cero Cuotas Nuevo Ingreso (N°)', f01, [
            { nombre: 'Total Nro', columna: 4, color: '#a6a6a6' },
            { nombre: 'Nuevo Ingreso', columna: 2, color: '#4472c4' },
            { nombre: 'Mantiene', columna: 6, color: '#ffc000' },
          ]),
          grafico('Cero Cuotas Nuevo Ingreso (S/MM)', f01, [
            { nombre: 'Total Saldo', columna: 5, color: '#a6a6a6' },
            { nombre: 'Nuevo Ingreso', columna: 3, color: '#4472c4' },
            { nombre: 'Mantiene', columna: 7, color: '#ffc000' },
          ], true),
          grafico('Nuevo Ingreso x Tramos de Atraso (N°)', f02, [
            { nombre: '1. <=8 días', columna: 2, color: '#4472c4' },
            { nombre: '2. <9 - 15 días', columna: 4, color: '#00b0f0' },
            { nombre: '3. <16 - 30 días', columna: 6, color: '#ffc000' },
            { nombre: '4. >31 días', columna: 8, color: '#e53935' },
          ]),
          grafico('Nuevo Ingreso x Tramos de Atraso (S/MM)', f02, [
            { nombre: '1. <=8 días', columna: 3, color: '#4472c4' },
            { nombre: '2. <9 - 15 días', columna: 5, color: '#00b0f0' },
            { nombre: '3. <16 - 30 días', columna: 7, color: '#ffc000' },
            { nombre: '4. >31 días', columna: 9, color: '#e53935' },
          ], true),
        ].filter((g) => g.categorias.length > 0);
      }),
    );
  }
}

/** Extrae filas del resultado. */
function filasDe(r: IWinderResponse): Record<string, unknown>[] {
  const resultado = (r.body as { resultado?: { data?: unknown[] } } | null)?.resultado;
  return (resultado?.data as Record<string, unknown>[]) ?? [];
}

/** Construye un bloque de gráfico a partir de filas. */
function grafico(
  titulo: string,
  filas: Record<string, unknown>[],
  series: readonly { nombre: string; columna: number; color: string }[],
  enMillones = false,
): BloqueGrafico {
  const valor = (fila: Record<string, unknown>, i: number): number | null => {
    const crudo = Object.values(fila)[i];
    if (crudo === null || crudo === undefined) return null;
    return enMillones ? Number(crudo) / 1_000_000 : Number(crudo);
  };
  return {
    titulo,
    categorias: filas.map((fila) => String(Object.values(fila)[1] ?? '')),
    series: series.map((s) => ({
      nombre: s.nombre,
      datos: filas.map((fila) => valor(fila, s.columna)),
      color: s.color,
    })),
  };
}

export { CORTES_TOP };

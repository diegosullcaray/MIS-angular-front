import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { TIMEOUT_MS, TIMEOUT_REPORTE_PESADO_MS } from '../../../../core/interceptors/auth.interceptor';
import { mapearBloqueReporte, mapearBloquesGrafico, mapearPeriodos, mapearTablaRegular } from '../utils/reportes-mapeo.util';
import { fechaCorte, fechaCorteCompacta } from '../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../models/tabla-dinamica.model';
import type { BloqueGrafico } from '../../../../shared/ui/graficos/models/grafico-comun.model';
import type { OpcionFiltro } from '../../../../shared/ui/formularios/opcion-filtro.model';

/** Nodo de jerarquía para los reportes. */
export type NodoConsulta = Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'> &
  Partial<Pick<HierarquiaNodo, 'des_rel' | 'lbl_hier' | 'lvl_hier'>>;

/** Servicio para el manejo de bloques de reportes. */
@Injectable({ providedIn: 'root' })
export class BloqueReporteService {
  private readonly reportes = inject(ModReportesService);
  private readonly shell = inject(ShellStateService);

  /** Fecha de corte en formato YYYYMMDD. */
  fec(): string {
    return fechaCorteCompacta(this.shell.usuarioActivo()?.fechaCorte);
  }

  /** Consulta de bloque regularData enviando solo parámetros base. */
  regular(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    const params = {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      ...(extra['fecha'] || extra['fec'] ? {} : { fec: this.fec() }),
      ...extra,
    };
    return this.reportes.getRegularData(codRep, params).pipe(map(mapearBloqueReporte));
  }

  /** Consulta paginada enviando el nodo completo y página. */
  regularPaginado(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
    pagina = 1,
  ): Observable<TablaReporteResultado> {
    return this.reportes
      .getRegularData(codRep, { pagen: pagina, ...nodo, ...extra })
      .pipe(map(mapearBloqueReporte));
  }

  /** Consulta de bloque regularData con parámetros exactos, sin fecha por defecto. */
  regularExacto(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, ...extra };
    return this.reportes.getRegularData(codRep, params).pipe(map(mapearBloqueReporte));
  }

  /** Consulta tolerante a fallos para bloques que pueden venir vacíos. */
  regularTolerante(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
  ): Observable<TablaReporteResultado> {
    return this.regularExacto(codRep, nodo, extra).pipe(catchError(() => of(TABLA_VACIA)));
  }

  /** Consulta tolerante a fallos con timeout extendido para reportes pesados. */
  regularLento(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
  ): Observable<TablaReporteResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, ...extra };
    const context = new HttpContext().set(TIMEOUT_MS, TIMEOUT_REPORTE_PESADO_MS);
    return this.reportes.getRegularData(codRep, params, context).pipe(
      map(mapearBloqueReporte),
      catchError(() => of(TABLA_VACIA)),
    );
  }

  /** Ejecuta múltiples consultas en paralelo. */
  regulares(
    bloques: readonly { codRep: string; extra?: Record<string, unknown> }[],
    nodo: NodoConsulta,
  ): Observable<TablaReporteResultado[]> {
    return forkJoin(bloques.map((b) => this.regular(b.codRep, nodo, b.extra)));
  }

  /** Fecha de corte en formato YYYY-MM-DD. */
  fecha(): string {
    return fechaCorte(this.shell.usuarioActivo()?.fechaCorte);
  }

  /** Consulta para tablas regulares dinámicas con parámetros específicos. */
  tablaRegularCon(codRep: string, params: Record<string, unknown> = {}, context?: HttpContext): Observable<TablaDinamicaResultado> {
    const peticion$ = context
      ? this.reportes.getRegularTableResult(codRep, params, context)
      : this.reportes.getRegularTableResult(codRep, params);
    return peticion$.pipe(map(mapearTablaRegular));
  }

  /** Consulta para tablas regulares de Carterización con sus propios parámetros. */
  tablaRegular(codRep: string, nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.tablaRegularCon(codRep, { tipcod: nodo.tip_cod, codrel: nodo.cod_rel, fecha: this.fecha() });
  }

  /** Obtiene las opciones de periodo desde el backend. */
  periodos(codRep: string): Observable<OpcionFiltro[]> {
    return this.reportes
      .getRegularTableResult(codRep, { fec: this.fecha() })
      .pipe(map(mapearPeriodos), catchError(() => of([])));
  }

  /** Consulta de bloque deprecado. */
  deprecado(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    const params = {
      ...nodo,
      ...(extra['fecha'] || extra['fec'] ? {} : { fec: this.fec() }),
      ...extra,
    };
    return this.reportes.getDeprecatedData(codRep, params).pipe(map(mapearBloqueReporte));
  }

  /** Consulta para bloques de gráficos. */
  graficos(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<BloqueGrafico[]> {
    const params = {
      ...nodo,
      ...(extra['fecha'] || extra['fec'] ? {} : { fec: this.fec() }),
      ...extra,
    };
    return this.reportes
      .getGraphicData(codRep, params)
      .pipe(
        map(mapearBloquesGrafico),
        catchError(() => of([]))
      );
  }
}

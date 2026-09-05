import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { mapearBloqueReporte, mapearBloquesGrafico, mapearPeriodos, mapearTablaRegular } from '../utils/reportes-mapeo.util';
import { fechaCorte, fechaCorteCompacta } from '../utils/fecha-reporte.util';
import { esBloqueVacio } from '../utils/error-bloque.util';
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

  /**
   * Consulta que tolera el bloque vacío: Ant responde 500 cuando un bloque no
   * tiene filas, y dentro de un `forkJoin` eso tumbaría el reporte entero.
   *
   * Solo absorbe la respuesta del servidor. Si la request nunca llegó —red
   * caída, cancelada— el error se propaga: ahí no hay "bloque vacío" que
   * mostrar, hay una consulta que no se hizo.
   */
  regularTolerante(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
  ): Observable<TablaReporteResultado> {
    return this.regularExacto(codRep, nodo, extra).pipe(this.tolerarBloqueVacio(TABLA_VACIA));
  }

  /** Absorbe el 500 de bloque vacío y deja pasar cualquier fallo de transporte. */
  private tolerarBloqueVacio<T>(vacio: T) {
    return (fuente: Observable<T>): Observable<T> =>
      fuente.pipe(catchError((e: unknown) => (esBloqueVacio(e) ? of(vacio) : throwError(() => e))));
  }

  /**
   * Reportes de data masiva ("Seguimiento Reprogramados", "Seguimiento de
   * Portafolio", proyecciones). Tolera el bloque vacío igual que
   * `regularTolerante()`: todos sus llamadores van dentro de un `forkJoin`.
   *
   * Ya no se distingue por el timeout —no hay ninguno, igual que en el STG—,
   * pero se conserva como nombre propio: marca en el código cuáles son los
   * bloques que tardan de verdad, que es justo lo que hay que saber antes de
   * meterlos en un `forkJoin` con otros.
   */
  regularLento(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
  ): Observable<TablaReporteResultado> {
    return this.regularTolerante(codRep, nodo, extra);
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
      .pipe(map(mapearPeriodos), this.tolerarBloqueVacio<OpcionFiltro[]>([]));
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
      .pipe(map(mapearBloquesGrafico), this.tolerarBloqueVacio<BloqueGrafico[]>([]));
  }
}

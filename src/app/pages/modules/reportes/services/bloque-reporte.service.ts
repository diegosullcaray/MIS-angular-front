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

/**
 * Nodo de jerarquía tal como viaja a los reportes. `tip_cod`/`cod_rel` son los
 * únicos obligatorios; los paginados mandan además el resto de `level_hierarchy`.
 */
export type NodoConsulta = Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'> &
  Partial<Pick<HierarquiaNodo, 'des_rel' | 'lbl_hier' | 'lvl_hier'>>;

/**
 * Acceso a los bloques del motor de reportes. Centraliza lo que cada reporte
 * repetía: resolver el corte, armar los parámetros del nodo y mapear la
 * respuesta cruda. Los `cod_rep` y los filtros propios los pone cada service.
 */
@Injectable({ providedIn: 'root' })
export class BloqueReporteService {
  private readonly reportes = inject(ModReportesService);
  private readonly shell = inject(ShellStateService);

  /** Fecha de corte declarada por el backend (`curr_fec`), en `YYYYMMDD`. */
  fec(): string {
    return fechaCorteCompacta(this.shell.usuarioActivo()?.fechaCorte);
  }

  /**
   * Un bloque de `regularData`. Manda solo `tip_cod`/`cod_rel` del nodo, que es
   * lo que arma el host `cra-v1p1`: aunque llegue el nodo completo, el resto de
   * sus campos no viaja.
   */
  regular(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    const params = {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      ...(extra['fecha'] || extra['fec'] ? {} : { fec: this.fec() }),
      ...extra,
    };
    return this.reportes.getRegularData(codRep, params).pipe(map(mapearBloqueReporte));
  }

  /**
   * Un bloque de los reportes PAGINADOS (host `cra-V10`): `pagen` más el nodo
   * COMPLETO, no solo `tip_cod`/`cod_rel`. Sin eso el backend responde
   * "Resultado vacio para: regularData".
   */
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

  /**
   * Un bloque con EXACTAMENTE los parámetros del mapa, sin el `fec` que agrega
   * `regular()`. Los hosts `cra-v4`, `-v7` y `-v11` no lo mandan, y los reportes
   * que cuelgan de ahí ya declaran su propio corte: sumarles `fec` los rompe.
   */
  regularExacto(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, ...extra };
    return this.reportes.getRegularData(codRep, params).pipe(map(mapearBloqueReporte));
  }

  /**
   * Igual que `regularExacto()`, pero un bloque sin datos no tumba al resto: el
   * backend responde 500 cuando la consulta no devuelve filas, y dentro de un
   * `forkJoin` eso mataba el reporte entero. Acá ese bloque queda como tabla
   * vacía y los demás se pintan igual.
   */
  regularTolerante(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
  ): Observable<TablaReporteResultado> {
    return this.regularExacto(codRep, nodo, extra).pipe(catchError(() => of(TABLA_VACIA)));
  }

  /**
   * Como `regularTolerante()`, pero con el timeout largo. Los reportes de data
   * masiva no entran en los 30 s por defecto, y subir ese global dejaría a toda
   * la app esperando el doble ante cualquier request colgada: cada uno pide el
   * suyo por `HttpContext`.
   */
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

  /** Varios bloques `regularData` en paralelo, con los mismos parámetros salvo los `extra` de cada uno. */
  regulares(
    bloques: readonly { codRep: string; extra?: Record<string, unknown> }[],
    nodo: NodoConsulta,
  ): Observable<TablaReporteResultado[]> {
    return forkJoin(bloques.map((b) => this.regular(b.codRep, nodo, b.extra)));
  }

  /** Fecha de corte del backend en `YYYY-MM-DD`, el formato que espera el motor `table.regular`. */
  fecha(): string {
    return fechaCorte(this.shell.usuarioActivo()?.fechaCorte);
  }

  /**
   * Un bloque del motor `table.regular` (columnas dinámicas). No hay un juego de
   * parámetros común —cada reporte nombra los suyos distinto, y alguno no manda
   * ninguno—, así que los pone cada service.
   */
  tablaRegularCon(codRep: string, params: Record<string, unknown> = {}, context?: HttpContext): Observable<TablaDinamicaResultado> {
    const peticion$ = context
      ? this.reportes.getRegularTableResult(codRep, params, context)
      : this.reportes.getRegularTableResult(codRep, params);
    return peticion$.pipe(map(mapearTablaRegular));
  }

  /**
   * Un bloque `table.regular` con los parámetros de Carterización: `tipcod`,
   * `codrel` y `fecha` con guiones — no los `tip_cod`/`cod_rel`/`fec` del motor
   * "mixto".
   */
  tablaRegular(codRep: string, nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.tablaRegularCon(codRep, { tipcod: nodo.tip_cod, codrel: nodo.cod_rel, fecha: this.fecha() });
  }

  /**
   * Las opciones del selector de periodo de los reportes del repositorio: un
   * desplegable de cortes que sale del backend (`RS_FECH` o `RS_FECH02` según el
   * reporte), no un calendario libre. La primera opción queda seleccionada y su
   * `id` reemplaza al corte del usuario en todas las consultas del reporte.
   */
  periodos(codRep: string): Observable<OpcionFiltro[]> {
    return this.reportes
      .getRegularTableResult(codRep, { fec: this.fecha() })
      .pipe(map(mapearPeriodos), catchError(() => of([])));
  }

  /** Un bloque del strand "deprecado" (`reportData`) — reportes cuya entrada de `cra-map.ts` no declara `reportType`. */
  deprecado(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    const params = {
      ...nodo,
      ...(extra['fecha'] || extra['fec'] ? {} : { fec: this.fec() }),
      ...extra,
    };
    return this.reportes.getDeprecatedData(codRep, params).pipe(map(mapearBloqueReporte));
  }

  /** Un bloque de gráficos Highcharts (`graphicData`). */
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

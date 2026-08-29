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
 * Nodo de jerarquía tal como viaja a los reportes.
 *
 * `tip_cod`/`cod_rel` son los únicos obligatorios (lo que manda la mayoría de
 * los hosts del legado). Los reportes paginados (`regularPaginado`) mandan
 * además el resto de campos que el backend devuelve en `level_hierarchy`, por
 * eso se declaran aquí como opcionales.
 */
export type NodoConsulta = Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'> &
  Partial<Pick<HierarquiaNodo, 'des_rel' | 'lbl_hier' | 'lvl_hier'>>;

/**
 * Acceso a los bloques del motor de reportes "mixtos".
 *
 * Centraliza lo que cada reporte repetía: resolver el `fec` de corte, armar los
 * parámetros del nodo y mapear la respuesta cruda. Los `cod_rep` y filtros
 * propios los pone cada service de reporte.
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
   * Un bloque del strand `regularData`.
   *
   * Manda solo `tip_cod`/`cod_rel` del nodo, que es lo que arma el host
   * `report-cra-v1p1` del legado (`let params = { ...filter, ...lp }`, con
   * `lp = { tip_cod, cod_rel }`) — de ahí el narrowing explícito: aunque llegue
   * el nodo completo, el resto de sus campos no viaja.
   */
  regular(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.fec(), ...extra };
    return this.reportes.getRegularData(codRep, params).pipe(map(mapearBloqueReporte));
  }

  /**
   * Un bloque `regularData` de los reportes PAGINADOS del legado (host
   * `report-cra-V10`), que arma sus parámetros distinto:
   * `{ ...page, ...filter, ...level }` — es decir, `pagen` más el nodo de
   * jerarquía COMPLETO (`lvl_hier`, `des_rel`, `lbl_hier` incluidos), no solo
   * `tip_cod`/`cod_rel`.
   *
   * Sin `pagen` y sin `lvl_hier` el backend responde
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
   * Un bloque `regularData` con EXACTAMENTE los parámetros que declara el mapa,
   * sin el `fec` que agrega `regular()` por su cuenta.
   *
   * Los hosts `report-cra-v4`, `-v7` y `-v11` arman sus parámetros como
   * `{ ...confT.getParamsAdd(), ...filter, ...level }`: los del bloque, los
   * filtros y `tip_cod`/`cod_rel`, y nada más. Los reportes que cuelgan de esos
   * hosts y ya declaran su propio corte (casi siempre como `fecha`) tienen que
   * pedirse así; mandarles además un `fec` los rompe.
   */
  regularExacto(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, ...extra };
    return this.reportes.getRegularData(codRep, params).pipe(map(mapearBloqueReporte));
  }

  /**
   * Igual que `regularExacto()`, pero un bloque sin datos no tumba al resto.
   *
   * El backend lanza `NullPointerException` con
   * `"Resultado vacio para: regularData"` (HTTP 500) cuando la consulta no
   * devuelve filas. Dentro de un `forkJoin` eso mata TODO el reporte, aunque los
   * demás bloques hayan respondido bien. Para los reportes de varios bloques
   * donde algunos pueden venir vacíos, este método los aísla: el bloque sin
   * datos queda como tabla vacía y los otros se pintan igual.
   */
  regularTolerante(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
  ): Observable<TablaReporteResultado> {
    return this.regularExacto(codRep, nodo, extra).pipe(catchError(() => of(TABLA_VACIA)));
  }

  /**
   * Como `regularTolerante()`, pero con el timeout largo de los reportes de data
   * masiva.
   *
   * "Seguimiento Reprogramados" y "Seguimiento de Portafolio" no entran en los
   * 30 s por defecto del interceptor. En vez de subir ese global —que dejaría a
   * toda la app esperando el doble ante cualquier request colgada— cada uno pide
   * el suyo por `HttpContext`.
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
   * Un bloque del motor `table.regular` (columnas dinámicas) con los
   * parámetros exactos que manda el legado.
   *
   * No hay un juego de parámetros común: Carterización manda
   * `tipcod`/`codrel`/`fecha`, Ranking Mujer `tip_cod`/`cod_rel`/`fec` y
   * Movimiento de Clientes no manda ninguno. Por eso los pone cada service.
   */
  tablaRegularCon(codRep: string, params: Record<string, unknown> = {}, context?: HttpContext): Observable<TablaDinamicaResultado> {
    return this.reportes.getRegularTableResult(codRep, params, context).pipe(map(mapearTablaRegular));
  }

  /**
   * Un bloque `table.regular` con los parámetros de Carterización.
   *
   * Ojo: este motor los espera como `tipcod`/`codrel`/`fecha` (y la fecha con
   * guiones), no como los `tip_cod`/`cod_rel`/`fec` del motor "mixto" — ver el
   * legado `carterizacion.component.ts` / `carterizacion-cap-com.component.ts`.
   */
  tablaRegular(codRep: string, nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.tablaRegularCon(codRep, { tipcod: nodo.tip_cod, codrel: nodo.cod_rel, fecha: this.fecha() });
  }

  /**
   * Las opciones del selector de periodo de los reportes del repositorio.
   *
   * Varios reportes del legado (`gestion-comercial`, `seguro-com`, `agro-mix`,
   * `cero-cuotas`, `usa_come-m`) abren con un desplegable de cortes que sale del
   * backend, no de un calendario libre: `RS_FECH` o `RS_FECH02` según el
   * reporte, siempre con `{ fec }` y siempre leyendo `meta1[0].json_result`.
   *
   * La primera opción es la que queda seleccionada, y su `id` reemplaza al corte
   * del usuario en todas las consultas del reporte.
   */
  periodos(codRep: string): Observable<OpcionFiltro[]> {
    return this.reportes
      .getRegularTableResult(codRep, { fec: this.fecha() })
      .pipe(map(mapearPeriodos), catchError(() => of([])));
  }

  /** Un bloque del strand "deprecado" (`reportData`) — reportes cuya entrada de `cra-map.ts` no declara `reportType`. */
  deprecado(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    return this.reportes.getDeprecatedData(codRep, { ...nodo, fec: this.fec(), ...extra }).pipe(map(mapearBloqueReporte));
  }

  /** Un bloque de gráficos Highcharts (`graphicData`). */
  graficos(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<BloqueGrafico[]> {
    return this.reportes
      .getGraphicData(codRep, { ...nodo, fec: this.fec(), ...extra })
      .pipe(
        map(mapearBloquesGrafico),
        catchError(() => of([]))
      );
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { mapearBloqueReporte, mapearTablaRegular } from '../utils/reportes-mapeo.util';
import { fechaCorte, fechaCorteCompacta } from '../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../models/jerarquia.model';
import type { TablaReporteResultado } from '../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../models/tabla-dinamica.model';

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
  tablaRegularCon(codRep: string, params: Record<string, unknown> = {}): Observable<TablaDinamicaResultado> {
    return this.reportes.getRegularTableResult(codRep, params).pipe(map(mapearTablaRegular));
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

  /** Un bloque del strand "deprecado" (`reportData`) — reportes cuya entrada de `cra-map.ts` no declara `reportType`. */
  deprecado(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    return this.reportes.getDeprecatedData(codRep, { ...nodo, fec: this.fec(), ...extra }).pipe(map(mapearBloqueReporte));
  }
}

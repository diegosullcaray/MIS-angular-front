import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { filasDeResultado, resultadoCrudo, tablaDeResultado } from '../../../../../utils/reportes-mapeo.util';
import { aplicarEstilosEstructuraDesembolsos } from '../../../../actividad-mensual/utils/estructura-desembolsos.util';
import { COD_CARTERA_REPO, PARAMS_RANKING_COMERCIAL, TABLAS_GESTION_COMERCIAL } from '../constantes/cartera.constantes';
import {
  columnasVisibles,
  conColumnasSemaforo,
  conSemaforos,
  graficoGestionComercial,
  seriesDeGrafico,
  tarjetasCmgCartera,
  totalesAgro,
} from '../utils/cartera-mapeo.util';
import { COLUMNAS_RANKING_COMERCIAL } from '../models/ranking-comercial.columnas';
import { GRAFICOS_AGRICOLA } from '../models/cartera-agricola.model';
import { GRAFICOS_GESTION_COMERCIAL, kpisDeFilaTotal } from '../models/gestion-comercial.model';
import type { TablaDinamicaResultado, TablaRegularResultadoRaw } from '../../../../../models/tabla-dinamica.model';
import type { ColumnaMonitor } from '../models/monitor-inteligencia.model';
import type { CmgCarteraResultado } from '../models/cmg-cartera.model';
import type { CarteraAgricolaResultado, DetalleAgricolaResultado } from '../models/cartera-agricola.model';
import type { GestionComercialResultado } from '../models/gestion-comercial.model';
import type { OpcionFiltro } from '../../../../../../../../shared/ui/formularios/opcion-filtro.model';

/**
 * Los reportes de Cartera que viven en el `repositorio` del legado (motor
 * `table.regular`). Acá solo se arman las peticiones: los `cod_rep` están en
 * `constantes/` y el mapeo de cada payload en `utils/`.
 */
@Injectable({ providedIn: 'root' })
export class CarteraRepositorioService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Estructura de Desembolsos, con la coloración condicional de la fila de distribución. */
  estructuraDesembolsos(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.bloques
      .tablaRegularCon(COD_CARTERA_REPO.estructuraDesembolsos, { ...this.paramsNodo(nodo), fec: this.bloques.fecha() })
      .pipe(map(aplicarEstilosEstructuraDesembolsos));
  }

  /** Cartera Agrícola · Cultivos. Las tarjetas del mes anterior salen de `meta1[0]`. */
  carteraAgricola(nodo: NodoConsulta): Observable<CarteraAgricolaResultado> {
    return this.reportes.getRegularTableResult(COD_CARTERA_REPO.carteraAgricola, this.paramsConFecha(nodo)).pipe(
      map((r) => {
        const resultado = resultadoCrudo(r);
        const filas = filasDeResultado(resultado);
        const meta = parseMeta(resultado);
        return {
          tabla: tablaDeResultado(resultado),
          totales: totalesAgro(filas[0] ?? {}, meta?.[0] ?? {}),
        };
      }),
    );
  }

  /**
   * Los cuatro gráficos del detalle por cultivo. Solo dos de ellos usan sus
   * filas: son los que abren el modal de detalle (el `detailDataMap` del legado).
   */
  detalleGraficosAgricola(nodo: NodoConsulta): Observable<DetalleAgricolaResultado> {
    const params = this.paramsConFecha(nodo);
    const bloques = GRAFICOS_AGRICOLA.map((g) => this.reportes.getRegularTableResult(g.codRep, params));

    return forkJoin(bloques).pipe(
      map((respuestas) => {
        const filasPorGrafico: Record<string, Record<string, unknown>[]> = {};
        const graficos = respuestas.map((r, i) => {
          const { titulo, id } = GRAFICOS_AGRICOLA[i];
          const resultado = resultadoCrudo(r);
          if (id) filasPorGrafico[id] = filasDeResultado(resultado);
          return { titulo, ...seriesDeGrafico(resultado?.headers) };
        });
        return { graficos, filasPorGrafico };
      }),
    );
  }

  /** Opciones del selector de periodo de Gestión Comercial. */
  periodosGestionComercial(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos(COD_CARTERA_REPO.periodosGestionComercial);
  }

  /**
   * Gestión Comercial: las tres tablas y los gráficos cuelgan del mismo nodo y
   * la misma fecha, así que se piden juntos. La fecha es la del selector de
   * periodo; si no llega, la de corte del usuario.
   */
  gestionComercial(nodo: NodoConsulta, fecha = this.bloques.fecha()): Observable<GestionComercialResultado> {
    const params = { ...this.paramsNodo(nodo), fecha };
    const tablas = TABLAS_GESTION_COMERCIAL.map((c) => this.reportes.getRegularTableResult(c, params));
    const graficos = GRAFICOS_GESTION_COMERCIAL.map((g) => this.reportes.getRegularTableResult(g.codRep, params));

    return forkJoin([...tablas, ...graficos]).pipe(
      map((respuestas) => {
        const [r01, r02, r03, ...rGraficos] = respuestas.map(resultadoCrudo);
        const filas = filasDeResultado(r01);
        return {
          filas,
          varSaldoVigente: tablaDeResultado(r02),
          varClientesStock: tablaDeResultado(r03),
          kpis: kpisDeFilaTotal(filas),
          graficos: rGraficos.map((r, i) => graficoGestionComercial(r, GRAFICOS_GESTION_COMERCIAL[i])),
        };
      }),
    );
  }

  /**
   * CMG Cartera. Las dos consultas usan nombres de parámetro distintos entre sí
   * (`codrel`/`Fecha` una, `cod_rel`/`fec` la otra): así están en el legado y
   * así los espera el backend.
   */
  cmgCartera(nodo: NodoConsulta, fase: number): Observable<CmgCarteraResultado> {
    const fecha = this.bloques.fecha();
    const tabla$ = this.reportes.getRegularTableResult(COD_CARTERA_REPO.cmgCarteraTabla, {
      codrel: nodo.cod_rel,
      Fecha: fecha,
      tipcod: nodo.tip_cod,
      met: '1',
      prod: fase,
    });
    const kpis$ = this.reportes.getRegularTableResult(COD_CARTERA_REPO.cmgCarteraKpis, {
      tipcod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      tipmet: '1',
      prod: fase,
      fec: fecha,
    });

    return forkJoin([tabla$, kpis$]).pipe(
      map(([respTabla, respKpis]) => {
        const rTabla = resultadoCrudo(respTabla);
        const filas = filasDeResultado(rTabla);
        const kpis = filasDeResultado(resultadoCrudo(respKpis))[0] ?? {};
        return {
          tabla: { columnas: conColumnasSemaforo(columnasVisibles(rTabla?.headers)), filas },
          tarjetas: tarjetasCmgCartera(filas, kpis),
        };
      }),
    );
  }

  /**
   * Ranking Comercial. No usa la jerarquía —de ahí que no reciba nodo—: trae el
   * ranking completo y se filtra del lado del cliente. Sus tres columnas de
   * semáforo tampoco vienen del backend, las calcula `conSemaforos`.
   */
  rankingComercial(): Observable<TablaDinamicaResultado> {
    const params = { ...PARAMS_RANKING_COMERCIAL, fecha: this.bloques.fecha() };
    return this.bloques
      .tablaRegularCon(COD_CARTERA_REPO.rankingComercial, params)
      .pipe(map(({ filas }) => ({ columnas: COLUMNAS_RANKING_COMERCIAL, filas: filas.map(conSemaforos) })));
  }

  /**
   * Monitor de Inteligencia de Negocios. No devuelve una tabla: el tablero de
   * columnas y tarjetas viene dentro de `headers`, que el legado desenvuelve un
   * nivel cuando llega anidado.
   */
  monitorInteligencia(nodo: NodoConsulta): Observable<ColumnaMonitor[]> {
    const params = { ...this.paramsNodo(nodo), fecha: this.bloques.fecha() };
    return this.reportes.getRegularTableResult(COD_CARTERA_REPO.monitorInteligencia, params).pipe(
      map((r) => {
        const crudo = resultadoCrudo(r)?.headers;
        if (!crudo) return [];
        const parseado = JSON.parse(crudo) as ColumnaMonitor[] | ColumnaMonitor[][];
        return Array.isArray(parseado[0]) ? (parseado[0] as ColumnaMonitor[]) : (parseado as ColumnaMonitor[]);
      }),
    );
  }

  private paramsNodo(nodo: NodoConsulta): Record<string, unknown> {
    return { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel };
  }

  private paramsConFecha(nodo: NodoConsulta): Record<string, unknown> {
    return { ...this.paramsNodo(nodo), fec: this.bloques.fecha() };
  }
}

/** `meta1` llega serializado en unos bloques y ya parseado en otros. */
function parseMeta(resultado: TablaRegularResultadoRaw | undefined): Record<string, unknown>[] | undefined {
  const meta = resultado?.meta1;
  return (typeof meta === 'string' ? JSON.parse(meta) : meta) as Record<string, unknown>[] | undefined;
}

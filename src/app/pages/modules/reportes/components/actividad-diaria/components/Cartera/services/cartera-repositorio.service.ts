import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import type { ColumnaDinamica, TablaDinamicaResultado, TablaRegularResultadoRaw } from '../../../../../models/tabla-dinamica.model';
import type { ColumnaMonitor } from '../models/monitor-inteligencia.model';
import { COLUMNAS_RANKING_COMERCIAL } from '../models/ranking-comercial.columnas';
import type { CmgCarteraResultado, TarjetaCmgCartera } from '../models/cmg-cartera.model';
import type { CarteraAgricolaResultado, TotalAgro, DetalleAgricolaResultado } from '../models/cartera-agricola.model';
import { GRAFICOS_AGRICOLA } from '../models/cartera-agricola.model';
import { TOTALES_AGRO } from '../models/cartera-agricola.model';
import type { BloqueGrafico } from '../../../../../models/grafico-reporte.model';

/** Los reportes de Cartera que viven en el `repositorio` del legado (motor `table.regular`). */
@Injectable({ providedIn: 'root' })
export class CarteraRepositorioService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /**
   * "Estructura de Desembolsos" — legado `repositorio/desembolsos` (`RS_DESEMB_01`).
   *
   * El legado además corre un `processHeaders()` que asigna un `cellRenderer`
   * a algunas subcolumnas, pero esa función devuelve el valor sin tocarlo en
   * las dos ramas: es código muerto y no se porta.
   */
  estructuraDesembolsos(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('RS_DESEMB_01', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: this.bloques.fecha(),
    });
  }

  /**
   * "Cartera Agrícola - Cultivos" — legado `repositorio/agro-mix-d` (`RS_AGROMIX_01`).
   *
   * Las tarjetas de mes anterior salen de `meta1[0]` y las del mes en curso de
   * la primera fila de la tabla, igual que el legado.
   */
  carteraAgricola(nodo: NodoConsulta): Observable<CarteraAgricolaResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.bloques.fecha() };
    return this.reportes.getRegularTableResult('RS_AGROMIX_01', params).pipe(
      map((r) => {
        const resultado = crudo(r);
        const filas = (resultado?.data ?? []) as Record<string, unknown>[];
        const meta = (typeof resultado?.meta1 === 'string' ? JSON.parse(resultado.meta1) : resultado?.meta1) as
          | Record<string, unknown>[]
          | undefined;
        return {
          tabla: { columnas: resultado?.headers ? (JSON.parse(resultado.headers) as ColumnaDinamica[]) : [], filas },
          totales: totalesAgro(filas[0] ?? {}, meta?.[0] ?? {}),
        };
      }),
    );
  }

  /**
   * Los cuatro gráficos del detalle por cultivo — legado `RS_AGROMIX_02` al `_05`.
   *
   * Cada bloque trae su `{categories, series}` dentro de `resultado.headers`;
   * `resultado.data` son las filas de clientes, y solo hacen falta las de los
   * dos gráficos que abren el modal de detalle (el `detailDataMap` del legado).
   */
  detalleGraficosAgricola(nodo: NodoConsulta): Observable<DetalleAgricolaResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.bloques.fecha() };
    const bloques = GRAFICOS_AGRICOLA.map((g) => this.reportes.getRegularTableResult(g.codRep, params));

    return forkJoin(bloques).pipe(
      map((respuestas) => {
        const filasPorGrafico: Record<string, Record<string, unknown>[]> = {};
        const graficos = respuestas.map((r, i) => {
          const { titulo, id } = GRAFICOS_AGRICOLA[i];
          const resultado = crudo(r);
          if (id) filasPorGrafico[id] = (resultado?.data ?? []) as Record<string, unknown>[];
          return { titulo, ...seriesDeGrafico(resultado?.headers) };
        });
        return { graficos, filasPorGrafico };
      }),
    );
  }

  /**
   * "CMG Cartera" — legado `repositorio/cmg-cartera`.
   *
   * Son dos consultas con nombres de parámetro que no coinciden entre sí (el
   * `_01` manda `codrel`/`Fecha`, el `_02` `cod_rel`/`fec`): así están en el
   * legado y el backend las espera así.
   */
  cmgCartera(nodo: NodoConsulta, fase: number): Observable<CmgCarteraResultado> {
    const fecha = this.bloques.fecha();
    const tabla$ = this.reportes.getRegularTableResult('CMG_CARTERA_01', {
      codrel: nodo.cod_rel,
      Fecha: fecha,
      tipcod: nodo.tip_cod,
      met: '1',
      prod: fase,
    });
    const kpis$ = this.reportes.getRegularTableResult('CMG_CARTERA_02', {
      tipcod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      tipmet: '1',
      prod: fase,
      fec: fecha,
    });

    return forkJoin([tabla$, kpis$]).pipe(
      map(([respTabla, respKpis]) => {
        const rTabla = crudo(respTabla);
        const filas = (rTabla?.data ?? []) as Record<string, unknown>[];
        return {
          tabla: { columnas: columnasVisibles(rTabla?.headers), filas },
          tarjetas: tarjetas(filas, ((crudo(respKpis)?.data ?? []) as Record<string, unknown>[])[0] ?? {}),
        };
      }),
    );
  }

  /**
   * "Ranking Comercial" — legado `repositorio/ranking-comercial` (`RS_RANK_COM_01`).
   *
   * Ojo con los parámetros: este reporte manda el nodo como
   * `territorio`/`corredor`, no como `tip_cod`/`cod_rel`.
   *
   * Las tres columnas `*_Semaforo` no vienen del backend: las arma el cliente
   * comparando cada avance contra el `Timing` (días transcurridos) de la fila,
   * por eso las cabeceras son fijas y no las del payload.
   */
  rankingComercial(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    const params = { territorio: nodo.cod_rel, corredor: nodo.tip_cod, fecha: this.bloques.fecha() };
    return this.bloques
      .tablaRegularCon('RS_RANK_COM_01', params)
      .pipe(map(({ filas }) => ({ columnas: COLUMNAS_RANKING_COMERCIAL, filas: filas.map(conSemaforos) })));
  }

  /**
   * "Monitor de Inteligencia de Negocios" — legado `repositorio/mon-int-comer`
   * (`RS_MON_INT_COM_01`).
   *
   * No devuelve una tabla, así que no pasa por `tablaRegularCon`: el tablero
   * de columnas y tarjetas viene dentro de `resultado.headers`, que el legado
   * desenvuelve un nivel cuando llega anidado.
   */
  monitorInteligencia(nodo: NodoConsulta): Observable<ColumnaMonitor[]> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fecha: this.bloques.fecha() };
    return this.reportes.getRegularTableResult('RS_MON_INT_COM_01', params).pipe(
      map((r) => {
        const crudo = (r.body as { resultado?: TablaRegularResultadoRaw } | null)?.resultado?.headers;
        if (!crudo) return [];
        const parseado = JSON.parse(crudo) as ColumnaMonitor[] | ColumnaMonitor[][];
        return Array.isArray(parseado[0]) ? (parseado[0] as ColumnaMonitor[]) : (parseado as ColumnaMonitor[]);
      }),
    );
  }
}

/** El `resultado` crudo de una respuesta del motor `table.regular`. */
function crudo(r: { body?: unknown }): TablaRegularResultadoRaw | undefined {
  return (r.body as { resultado?: TablaRegularResultadoRaw } | null)?.resultado;
}

/** El legado descarta las columnas que el backend marca como ocultas. */
function columnasVisibles(headers: string | undefined): ColumnaDinamica[] {
  if (!headers) return [];
  const todas = JSON.parse(headers) as (ColumnaDinamica & { cellStyle?: { display?: string } })[];
  return todas.filter((h) => h.cellStyle?.display?.toLowerCase() !== 'none');
}

/**
 * Las tarjetas del encabezado. Las de saldo salen de la fila 18 de la tabla
 * por índice fijo, tal cual el legado; si el reporte devuelve menos filas se
 * quedan sin valor en vez de romper la pantalla.
 */
function tarjetas(filasTabla: Record<string, unknown>[], kpis: Record<string, unknown>): TarjetaCmgCartera[] {
  const num = (v: unknown) => Number(String(v ?? '0').replace(/,/g, '')) || 0;
  const fila18 = filasTabla[18] as Record<string, unknown> | undefined;
  const fila16 = filasTabla[16] as Record<string, unknown> | undefined;

  const saldoMedio = num(fila18?.[6]);
  const saldoMedioAnterior = num(fila18?.[5]);

  return [
    {
      etiqueta: 'Monto Desembolsado (miles PEN)',
      valor: num(kpis['des_acum']) / 1000,
      comparativo: `Meta ${(num(kpis['meta_des_acum']) / 1000).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`,
      senal: Math.sign(num(kpis['des_acum']) - num(kpis['meta_des_acum'])),
      cumplimiento: kpis['cumpl_des_acum'] == null ? undefined : num(kpis['cumpl_des_acum']),
    },
    {
      etiqueta: 'Ope. Desembolsada (Nro)',
      valor: num(kpis['ope_acum_']),
      comparativo: `Meta ${num(kpis['meta_ope_acum_']).toLocaleString('es-PE')}`,
      senal: Math.sign(num(kpis['ope_acum_']) - num(kpis['meta_ope_acum_'])),
      cumplimiento: kpis['cumpl_ope_acum'] == null ? undefined : num(kpis['cumpl_ope_acum']),
    },
    {
      etiqueta: 'TAPP Mes / TAPP Mínima',
      valor: String(fila16?.[6] ?? ''),
      comparativo: String(kpis['tasaminima'] ?? ''),
      senal: 0,
    },
    {
      etiqueta: 'Saldo Medio Vigente (miles PEN)',
      valor: saldoMedio,
      comparativo: `Mes anterior ${saldoMedioAnterior.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`,
      senal: Math.sign(saldoMedio - saldoMedioAnterior),
    },
  ];
}

/** Avance con su semáforo delante, en el formato exacto del legado (`🟢 15.28%`). */
function semaforo(avanceCrudo: unknown, timingDecimal: number): string {
  const avance = Number(avanceCrudo);
  if (avanceCrudo == null || Number.isNaN(avance)) return '';

  const formateado = `${(avance * 100).toFixed(2)}%`;
  if (timingDecimal === 0) return formateado;

  const icono = avance >= timingDecimal ? '🟢' : avance / timingDecimal >= 0.8 ? '🟡' : '🔴';
  return `${icono} ${formateado}`;
}

/** Claves de avance del legado y la columna calculada que alimenta cada una. */
const AVANCES: [origen: string, destino: string][] = [
  ['Percent_Cumpl', 'Percent_Cumpl_Semaforo'],
  ['percent_cumpl_desemb', 'percent_cumpl_desemb_Semaforo'],
  ['percent_cumpl_varsalv', 'percent_cumpl_varsalv_Semaforo'],
];

function conSemaforos(fila: Record<string, unknown>): Record<string, unknown> {
  const timing = fila['Timing'] ? Number(fila['Timing']) / 100 : 0;
  const calculadas = Object.fromEntries(AVANCES.map(([origen, destino]) => [destino, semaforo(fila[origen], timing)]));
  return { ...fila, ...calculadas };
}

/** Cada total del encabezado: valor de hoy contra el del mes anterior (`meta1`). */
function totalesAgro(primeraFila: Record<string, unknown>, mesAnterior: Record<string, unknown>): TotalAgro[] {
  return TOTALES_AGRO.map(({ clave, etiqueta, formato }) => {
    const actual = Number(primeraFila[clave] ?? 0);
    const anterior = Number(mesAnterior[clave] ?? 0);
    return { etiqueta, formato, actual, anterior, senal: Math.sign(actual - anterior) };
  });
}

/** Los bloques de gráfico traen su `{categories, series}` serializado en `headers`. */
function seriesDeGrafico(headers: string | undefined): Pick<BloqueGrafico, 'categorias' | 'series'> {
  if (!headers) return { categorias: [], series: [] };
  const datos = JSON.parse(headers) as { categories?: string[]; series?: { name: string; data: (number | null)[] }[] };
  return {
    categorias: datos.categories ?? [],
    series: (datos.series ?? []).map((s) => ({ nombre: s.name, datos: s.data })),
  };
}

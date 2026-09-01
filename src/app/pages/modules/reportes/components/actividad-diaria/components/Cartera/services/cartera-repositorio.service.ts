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
import { aplicarEstilosEstructuraDesembolsos } from '../../../../actividad-mensual/services/actividad-mensual-repo.service';
import {
  GRAFICOS_GESTION_COMERCIAL,
  kpisDeFilaTotal,
  type GestionComercialResultado,
  type GraficoGestionComercial,
} from '../models/gestion-comercial.model';
import { TOTALES_AGRO } from '../models/cartera-agricola.model';
import type { BloqueGrafico, FormatoValor } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { OpcionFiltro } from '../../../../../../../../shared/ui/formularios/opcion-filtro.model';

/** Servicio de repositorio para reportes de Cartera. */
@Injectable({ providedIn: 'root' })
export class CarteraRepositorioService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Estructura de Desembolsos. */
  estructuraDesembolsos(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.bloques
      .tablaRegularCon('RS_DESEMB_01', {
        tip_cod: nodo.tip_cod,
        cod_rel: nodo.cod_rel,
        fec: this.bloques.fecha(),
      })
      .pipe(map((tabla) => aplicarEstilosEstructuraDesembolsos(tabla)));
  }

  /** Cartera Agrícola - Cultivos. */
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

  /** Gráficos del detalle por cultivo. */
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

  /** Opciones del selector de periodo de Gestión Comercial. */
  periodosGestionComercial(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos('RS_FECH02');
  }

  /** Gestión Comercial. */
  gestionComercial(nodo: NodoConsulta, fecha = this.bloques.fecha()): Observable<GestionComercialResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fecha };
    const tablas = ['RS_GEST_COM_01', 'RS_GEST_COM_02', 'RS_GEST_COM_03'].map((c) =>
      this.reportes.getRegularTableResult(c, params),
    );
    const graficos = GRAFICOS_GESTION_COMERCIAL.map((g) => this.reportes.getRegularTableResult(g.codRep, params));

    return forkJoin([...tablas, ...graficos]).pipe(
      map((respuestas) => {
        const [r01, r02, r03, ...rGraficos] = respuestas.map(crudo);
        const filas = (r01?.data ?? []) as Record<string, unknown>[];
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

  /** CMG Cartera. */
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
        const kpis = ((crudo(respKpis)?.data ?? []) as Record<string, unknown>[])[0] ?? {};
        return {
          tabla: { columnas: conColumnasSemaforo(columnasVisibles(rTabla?.headers)), filas },
          tarjetas: tarjetas(filas, kpis),
        };
      }),
    );
  }

  /** Ranking Comercial. */
  rankingComercial(): Observable<TablaDinamicaResultado> {
    const params = { territorio: '0', corredor: '0', fecha: this.bloques.fecha() };
    return this.bloques
      .tablaRegularCon('RS_RANK_COM_01', params)
      .pipe(map(({ filas }) => ({ columnas: COLUMNAS_RANKING_COMERCIAL, filas: filas.map(conSemaforos) })));
  }

  /** Monitor de Inteligencia de Negocios. */
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

/** Obtiene el resultado crudo. */
function crudo(r: { body?: unknown }): TablaRegularResultadoRaw | undefined {
  return (r.body as { resultado?: TablaRegularResultadoRaw } | null)?.resultado;
}

/** Filtra columnas visibles. */
function columnasVisibles(headers: string | undefined): ColumnaDinamica[] {
  if (!headers) return [];
  const todas = JSON.parse(headers) as (ColumnaDinamica & { cellStyle?: { display?: string } })[];
  return todas.filter((h) => h.cellStyle?.display?.toLowerCase() !== 'none');
}

/** Construye las tarjetas del encabezado. */
function tarjetas(filasTabla: Record<string, unknown>[], kpis: Record<string, unknown>): TarjetaCmgCartera[] {
  const num = (v: unknown) => Number(String(v ?? '0').replace(/[^0-9.-]/g, '')) || 0;
  const fila18 = filasTabla[18] as Record<string, unknown> | undefined;
  const fila16 = filasTabla[16] as Record<string, unknown> | undefined;

  const saldoMedio = num(fila18?.[6]);
  const saldoMedioAnterior = num(fila18?.[5]);
  const deltaSaldo = saldoMedio - saldoMedioAnterior;

  const tappMes = fila16?.[6] == null ? undefined : num(fila16[6]);
  const tappMinima = kpis['tasaminima'] == null ? undefined : num(kpis['tasaminima']);
  const deltaPbs = tappMes === undefined || tappMinima === undefined ? undefined : Math.round((tappMes - tappMinima) * 100);
  const senalTapp = deltaPbs === undefined ? 0 : Math.sign(deltaPbs);

  return [
    {
      etiqueta: 'Monto Desembolsado (miles PEN)',
      valor: num(kpis['des_acum']) / 1000,
      comparativo: `Meta ${(num(kpis['meta_des_acum']) / 1000).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`,
      senal: 0,
      cumplimiento: kpis['cumpl_des_acum'] == null ? undefined : num(kpis['cumpl_des_acum']),
    },
    {
      etiqueta: 'Ope. Desembolsada (Nro)',
      valor: num(kpis['ope_acum_']),
      comparativo: `Meta ${num(kpis['meta_ope_acum_']).toLocaleString('es-PE')}`,
      senal: 0,
      cumplimiento: kpis['cumpl_ope_acum'] == null ? undefined : num(kpis['cumpl_ope_acum']),
    },
    {
      etiqueta: 'TAPP Mes / TAPP Mínima',
      valor: String(fila16?.[6] ?? ''),
      comparativo: String(kpis['tasaminima'] ?? ''),
      senal: senalTapp,
      delta: deltaPbs === undefined ? undefined : `${deltaPbs.toLocaleString('es-PE')} pbs`,
    },
    {
      etiqueta: 'Saldo Medio Vigente (miles PEN)',
      valor: saldoMedio,
      comparativo: `Mes anterior ${saldoMedioAnterior.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`,
      senal: Math.sign(deltaSaldo),
      delta: Math.round(deltaSaldo).toLocaleString('es-PE'),
    },
  ];
}

/** Mapeo de columnas con semáforo. */
const SEMAFOROS_CMG_CARTERA: Readonly<Record<string, string>> = { '9': '8', '11': '10', '13': '12' };

function conColumnasSemaforo(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
  return columnas.map((c) => (SEMAFOROS_CMG_CARTERA[c.key] ? { ...c, semaforoKey: SEMAFOROS_CMG_CARTERA[c.key] } : c));
}

/** Calcula señal del semáforo. */
function semaforo(avanceCrudo: unknown, timingDecimal: number): number | '' {
  const avance = Number(avanceCrudo);
  if (avanceCrudo == null || Number.isNaN(avance)) return '';
  if (timingDecimal === 0) return '';

  if (avance >= timingDecimal) return 1;
  return avance / timingDecimal >= 0.8 ? 0 : -1;
}

/** Claves de avance y columnas destino. */
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

/** Calcula totales comparativos. */
function totalesAgro(primeraFila: Record<string, unknown>, mesAnterior: Record<string, unknown>): TotalAgro[] {
  return TOTALES_AGRO.map(({ clave, etiqueta, formato }) => {
    const actual = Number(primeraFila[clave] ?? 0);
    const anterior = Number(mesAnterior[clave] ?? 0);
    return { etiqueta, formato, actual, anterior, senal: Math.sign(actual - anterior) };
  });
}

/** Extrae series del gráfico. */
function seriesDeGrafico(headers: string | undefined): Pick<BloqueGrafico, 'categorias' | 'series'> {
  if (!headers) return { categorias: [], series: [] };
  const datos = JSON.parse(headers) as { categories?: string[]; series?: { name: string; data: (number | null)[] }[] };
  return {
    categorias: datos.categories ?? [],
    series: (datos.series ?? []).map((s) => ({ nombre: s.name, datos: s.data })),
  };
}

/** Procesa un gráfico de Gestión Comercial. */
function graficoGestionComercial(
  resultado: TablaRegularResultadoRaw | undefined,
  config: GraficoGestionComercial,
): BloqueGrafico & { formato: FormatoValor } {
  const { titulo, formato, apilado, esPorcentaje, esNivel, colorDeSerie } = config;
  const base = { titulo, formato, apilado, categorias: [] as string[], series: [] };

  const datos = parseGrafico(cargaUtilGrafico(resultado));
  if (!datos) return base;

  return {
    titulo,
    formato,
    apilado,
    categorias: datos.categories ?? [],
    series: (datos.series ?? []).map((s) => {
      const nombre = s.name ?? '';
      const color = colorDeSerie?.(nombre);
      if (esPorcentaje?.(nombre)) {
        return { nombre: `${nombre} %`, datos: (s.data ?? []).map((v) => (v == null ? v : v * 100)), ...(color ? { color } : {}) };
      }
      return {
        nombre,
        datos: s.data ?? [],
        ...(esNivel?.(nombre) ? { secundaria: true } : {}),
        ...(color ? { color } : {}),
      };
    }),
  };
}

/** Obtiene la carga útil del gráfico. */
function cargaUtilGrafico(resultado: TablaRegularResultadoRaw | undefined): unknown {
  const primeraFila = (resultado?.data as Record<string, unknown>[] | undefined)?.[0];
  if (primeraFila) {
    const primeraClave = Object.keys(primeraFila)[0];
    if (primeraClave !== undefined) return primeraFila[primeraClave];
  }
  return resultado?.headers;
}

interface DatosGraficoCrudo {
  categories?: string[];
  series?: { name?: string; data?: (number | null)[] }[];
}

/** Parsea datos del gráfico. */
function parseGrafico(carga: unknown): DatosGraficoCrudo | undefined {
  if (carga && typeof carga === 'object') return carga as DatosGraficoCrudo;
  if (typeof carga !== 'string' || carga === '') return undefined;
  try {
    return JSON.parse(carga) as DatosGraficoCrudo;
  } catch {
    return undefined;
  }
}

/** Construye tabla desde el resultado. */
function tablaDeResultado(resultado: TablaRegularResultadoRaw | undefined): TablaDinamicaResultado {
  return {
    columnas: resultado?.headers ? (JSON.parse(resultado.headers) as ColumnaDinamica[]) : [],
    filas: (resultado?.data ?? []) as Record<string, unknown>[],
  };
}

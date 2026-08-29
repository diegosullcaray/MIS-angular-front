import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import type { ColumnaDinamica, TablaDinamicaResultado, TablaRegularResultadoRaw } from '../../../models/tabla-dinamica.model';
import type { CmgCarteraResultado, TarjetaCmgCartera } from '../../actividad-diaria/components/Cartera/models/cmg-cartera.model';
import type { CarteraAgricolaResultado, TotalAgro, DetalleAgricolaResultado } from '../../actividad-diaria/components/Cartera/models/cartera-agricola.model';
import { GRAFICOS_AGRICOLA, TOTALES_AGRO } from '../../actividad-diaria/components/Cartera/models/cartera-agricola.model';
import type { BloqueGrafico } from '../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { OpcionFiltro } from '../../../../../../shared/ui/formularios/opcion-filtro.model';

@Injectable({ providedIn: 'root' })
export class ActividadMensualRepoService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Opciones de periodos para reportes con filtro de cierre mensual. */
  periodos(codRep = 'RS_FECH'): Observable<OpcionFiltro[]> {
    return this.bloques.periodos(codRep);
  }

  /** Tablero Digital Comercial (`RS_TAB_COM_01`). */
  tableroDigitalComercial(nodo: NodoConsulta, fecha?: string): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('RS_TAB_COM_01', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: fecha || this.bloques.fecha(),
    });
  }

  /** Estructura de Desembolsos (`RS_DESEMB_01`). */
  estructuraDesembolsos(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.bloques
      .tablaRegularCon('RS_DESEMB_01', {
        tip_cod: nodo.tip_cod,
        cod_rel: nodo.cod_rel,
        fec: this.bloques.fecha(),
      })
      .pipe(map((tabla) => aplicarEstilosEstructuraDesembolsos(tabla)));
  }

  /** Cartera Agrícola - Cultivos (`RS_AGROMIX_01`). */
  carteraAgricola(nodo: NodoConsulta, fecha?: string): Observable<CarteraAgricolaResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: fecha || this.bloques.fecha() };
    return this.reportes.getRegularTableResult('RS_AGROMIX_01', params).pipe(
      map((r: { body?: unknown }) => {
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

  /** Detalle gráficos agrícola (`RS_AGROMIX_02` al `_05`). */
  detalleGraficosAgricola(nodo: NodoConsulta): Observable<DetalleAgricolaResultado> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.bloques.fecha() };
    const observables = GRAFICOS_AGRICOLA.map((g: { codRep: string }) =>
      this.reportes.getRegularTableResult(g.codRep, params),
    );

    return forkJoin(observables).pipe(
      map((respuestas: { body?: unknown }[]) => {
        const filasPorGrafico: Record<string, Record<string, unknown>[]> = {};
        const graficos = respuestas.map((r: { body?: unknown }, i: number) => {
          const { titulo, id } = GRAFICOS_AGRICOLA[i];
          const resultado = crudo(r);
          if (id) filasPorGrafico[id] = (resultado?.data ?? []) as Record<string, unknown>[];
          return { titulo, ...seriesDeGrafico(resultado?.headers) };
        });
        return { graficos, filasPorGrafico };
      }),
    );
  }

  /** CMG Cartera (`CMG_CARTERA_01` y `_02`). */
  cmgCartera(nodo: NodoConsulta, fase: number, fecha?: string): Observable<CmgCarteraResultado> {
    const fecCorte = fecha || this.bloques.fecha();
    const tabla$ = this.reportes.getRegularTableResult('CMG_CARTERA_01', {
      codrel: nodo.cod_rel,
      Fecha: fecCorte,
      tipcod: nodo.tip_cod,
      met: '1',
      prod: fase,
    });
    const kpis$ = this.reportes.getRegularTableResult('CMG_CARTERA_02', {
      tipcod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      tipmet: '1',
      prod: fase,
      fec: fecCorte,
    });

    return forkJoin({ respTabla: tabla$, respKpis: kpis$ }).pipe(
      map(({ respTabla, respKpis }) => {
        const rTabla = crudo(respTabla as { body?: unknown });
        const filas = (rTabla?.data ?? []) as Record<string, unknown>[];
        const kpis = ((crudo(respKpis as { body?: unknown })?.data ?? []) as Record<string, unknown>[])[0] ?? {};
        return {
          tabla: { columnas: conColumnasSemaforo(columnasVisibles(rTabla?.headers)), filas },
          tarjetas: tarjetas(filas, kpis),
        };
      }),
    );
  }
}

function crudo(r: { body?: unknown }): TablaRegularResultadoRaw | undefined {
  return (r?.body as { resultado?: TablaRegularResultadoRaw } | null)?.resultado;
}

function columnasVisibles(headers: string | undefined): ColumnaDinamica[] {
  if (!headers) return [];
  const todas = JSON.parse(headers) as (ColumnaDinamica & { cellStyle?: { display?: string } })[];
  return todas.filter((h) => h.cellStyle?.display?.toLowerCase() !== 'none');
}

function tarjetas(filasTabla: Record<string, unknown>[], kpis: Record<string, unknown>): TarjetaCmgCartera[] {
  const num = (v: unknown) => Number(String(v ?? '0').replace(/[^0-9.-]/g, '')) || 0;
  const fila18 = filasTabla[18] as Record<string, unknown> | undefined;
  const fila16 = filasTabla[16] as Record<string, unknown> | undefined;

  const saldoMedio = num(fila18?.[6]);
  const saldoMedioAnterior = num(fila18?.[5]);
  const deltaSaldo = saldoMedio - saldoMedioAnterior;

  const rawTappMes = String(fila16?.[6] ?? '').trim();
  const rawTappMinima = String(kpis['tasaminima'] ?? '').trim();
  const numTappMes = fila16?.[6] == null ? 0 : num(fila16[6]);
  const numTappMinima = kpis['tasaminima'] == null ? 0 : num(kpis['tasaminima']);
  const deltaPbs = Math.round((numTappMes - numTappMinima) * 100);
  const senalTapp = numTappMes >= numTappMinima ? 1 : -1;
  const senalSaldo = deltaSaldo >= 0 ? 1 : -1;

  const displayTappMes = rawTappMes ? (rawTappMes.includes('%') ? rawTappMes : `${numTappMes.toFixed(2)} %`) : '—';
  const displayTappMin = rawTappMinima ? (rawTappMinima.includes('%') ? rawTappMinima : `${numTappMinima.toFixed(2)} %`) : '—';

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
      valor: displayTappMes,
      comparativo: `Mínima ${displayTappMin}`,
      senal: senalTapp,
      delta: `${deltaPbs >= 0 ? '+' : ''}${deltaPbs.toLocaleString('es-PE')} pbs`,
    },
    {
      etiqueta: 'Saldo Medio Vigente (miles PEN)',
      valor: saldoMedio,
      comparativo: `Mes anterior ${saldoMedioAnterior.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`,
      senal: senalSaldo,
      delta: `${deltaSaldo >= 0 ? '+' : ''}${Math.round(deltaSaldo).toLocaleString('es-PE')}`,
    },
  ];
}

const SEMAFOROS_CMG_CARTERA: Readonly<Record<string, string>> = { '9': '8', '11': '10', '13': '12' };

function conColumnasSemaforo(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
  return columnas.map((c) => (SEMAFOROS_CMG_CARTERA[c.key] ? { ...c, semaforoKey: SEMAFOROS_CMG_CARTERA[c.key] } : c));
}

function totalesAgro(primeraFila: Record<string, unknown>, mesAnterior: Record<string, unknown>): TotalAgro[] {
  return TOTALES_AGRO.map(({ clave, etiqueta, formato }: { clave: string; etiqueta: string; formato: 'entero' | 'moneda' }) => {
    const actual = Number(primeraFila[clave] ?? 0);
    const anterior = Number(mesAnterior[clave] ?? 0);
    return { etiqueta, formato, actual, anterior, senal: Math.sign(actual - anterior) };
  });
}

function seriesDeGrafico(headers: string | undefined): Pick<BloqueGrafico, 'categorias' | 'series'> {
  if (!headers) return { categorias: [], series: [] };
  const datos = JSON.parse(headers) as { categories?: string[]; series?: { name: string; data: (number | null)[] }[] };
  return {
    categorias: datos.categories ?? [],
    series: (datos.series ?? []).map((s) => ({ nombre: s.name, datos: s.data })),
  };
}

const COLORES_CRONOLOGICOS_DESEMB = [
  { bg: '#22c55e', text: '#ffffff' }, // Verde (menor valor)
  { bg: '#84cc16', text: '#ffffff' }, // Verde limón
  { bg: '#eab308', text: '#000000' }, // Amarillo
  { bg: '#f97316', text: '#ffffff' }, // Naranja
  { bg: '#ef4444', text: '#ffffff' }, // Rojo (mayor valor)
];

function getEstiloCeldaEstructuraDesembolsos(
  fila: Record<string, unknown>,
  columnKey: string,
  grupoColumnas: string[],
): Record<string, string> | undefined {
  const idRango = Number(fila['IDRango'] ?? fila['idrango'] ?? fila['ID_RANGO']);
  const desRango = String(fila['DES_RANGO'] ?? fila['des_rango'] ?? '').toLowerCase();
  const esFilaObjetivo = idRango === 12 || desRango.includes('part') || desRango.includes('total') || fila['style'] === 1;

  if (!esFilaObjetivo) return undefined;

  const parseNum = (v: unknown): number => {
    if (v == null) return 0;
    const clean = String(v).replace(/%/g, '').replace(/,/g, '').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const valoresGrupo = grupoColumnas.map((col) => ({
    key: col,
    value: parseNum(fila[col]),
  }));

  const ordenados = [...valoresGrupo].sort((a, b) => a.value - b.value);
  const index = ordenados.findIndex((item) => item.key.toLowerCase() === columnKey.toLowerCase());
  if (index === -1) return undefined;

  let color = COLORES_CRONOLOGICOS_DESEMB[index];
  if (grupoColumnas.length === 3) {
    const mapaTres = [COLORES_CRONOLOGICOS_DESEMB[0], COLORES_CRONOLOGICOS_DESEMB[2], COLORES_CRONOLOGICOS_DESEMB[4]];
    color = mapaTres[index] ?? COLORES_CRONOLOGICOS_DESEMB[0];
  }

  return {
    'background-color': color.bg,
    color: color.text,
    'font-weight': 'bold',
    'text-align': 'center',
    'border-radius': '4px',
  };
}

export function aplicarEstilosEstructuraDesembolsos(tabla: TablaDinamicaResultado): TablaDinamicaResultado {
  const columnasOpe = ['1_Ope', '2_Ope', '3_Ope'];
  const columnasMon = ['1_MON', '2_MON', '3_MON'];

  function procesarColumnas(cols: ColumnaDinamica[]): ColumnaDinamica[] {
    return cols.map((col) => {
      const nuevaCol = { ...col };
      const isOpe = columnasOpe.some((k) => k.toLowerCase() === col.key.toLowerCase());
      const isMon = columnasMon.some((k) => k.toLowerCase() === col.key.toLowerCase());

      if (isOpe) {
        nuevaCol.cellStyleFn = (_v, fila) =>
          getEstiloCeldaEstructuraDesembolsos(fila, col.key, columnasOpe);
      } else if (isMon) {
        nuevaCol.cellStyleFn = (_v, fila) =>
          getEstiloCeldaEstructuraDesembolsos(fila, col.key, columnasMon);
      }

      if (nuevaCol.subs && nuevaCol.subs.length > 0) {
        nuevaCol.subs = procesarColumnas(nuevaCol.subs);
      }
      return nuevaCol;
    });
  }

  return {
    columnas: procesarColumnas(tabla.columnas),
    filas: tabla.filas,
  };
}


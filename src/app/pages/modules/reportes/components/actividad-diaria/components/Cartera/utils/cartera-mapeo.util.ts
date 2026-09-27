import { filasDeResultado } from '../../../../../utils/reportes-mapeo.util';
import type { TablaRegularResultadoRaw } from '../../../../../models/tabla-dinamica.model';
import type {
  BloqueGrafico,
  FormatoValor,
} from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { TarjetaCmgCartera } from '../../../../../models/cmg-cartera.model';
import type { GraficoGestionComercial } from '../models/gestion-comercial.model';
import { AVANCES_RANKING_COMERCIAL } from '../constantes/cartera.constantes';
import { FILAS_TARJETAS_CMG } from '../../../../../constantes/cmg-cartera.constantes';

/** Mapeo de los payloads de Cartera. Son funciones puras: el service solo pide. */

/**
 * Tarjetas del encabezado de CMG Cartera. Los saldos salen de filas de índice
 * fijo, tal cual el legado; con menos filas quedan sin valor en vez de romper.
 */
export function tarjetasCmgCartera(
  filasTabla: Record<string, unknown>[],
  kpis: Record<string, unknown>,
): TarjetaCmgCartera[] {
  // `tasaminima` llega como `"42.07%"`: se descarta todo lo que no sea dígito, signo o punto.
  const num = (v: unknown) => Number(String(v ?? '0').replace(/[^0-9.-]/g, '')) || 0;
  const filaSaldo = filasTabla[FILAS_TARJETAS_CMG.saldoMedio] as
    Record<string, unknown> | undefined;
  const filaTapp = filasTabla[FILAS_TARJETAS_CMG.tapp] as Record<string, unknown> | undefined;

  const saldoMedio = num(filaSaldo?.[6]);
  const saldoMedioAnterior = num(filaSaldo?.[5]);
  const deltaSaldo = saldoMedio - saldoMedioAnterior;

  const tappMes = filaTapp?.[6] == null ? undefined : num(filaTapp[6]);
  const tappMinima = kpis['tasaminima'] == null ? undefined : num(kpis['tasaminima']);
  const deltaPbs =
    tappMes === undefined || tappMinima === undefined
      ? undefined
      : Math.round((tappMes - tappMinima) * 100);

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
      // El legado muestra aquí solo la meta, sin rótulo (a diferencia del monto desembolsado).
      comparativo: num(kpis['meta_ope_acum_']).toLocaleString('es-PE'),
      senal: 0,
      cumplimiento: kpis['cumpl_ope_acum'] == null ? undefined : num(kpis['cumpl_ope_acum']),
    },
    {
      etiqueta: 'TAPP Mes / TAPP Mínima',
      valor: String(filaTapp?.[6] ?? ''),
      comparativo: String(kpis['tasaminima'] ?? ''),
      senal: deltaPbs === undefined ? 0 : Math.sign(deltaPbs),
      delta: deltaPbs === undefined ? undefined : `${deltaPbs.toLocaleString('es-PE')} pbs`,
    },
    {
      etiqueta: 'Saldo Medio Vigente (miles PEN)',
      valor: saldoMedio,
      comparativo: `Mes Anterior ${saldoMedioAnterior.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`,
      senal: Math.sign(deltaSaldo),
      delta: Math.round(deltaSaldo).toLocaleString('es-PE'),
    },
  ];
}

/**
 * Señal del semáforo de un avance contra el timing del mes: `1` en meta, `0`
 * cerca, `-1` lejos. El legado incrustaba el emoji en el texto; acá se devuelve
 * la señal y el punto lo pinta la tabla, dejando el porcentaje como número.
 */
function semaforo(avanceCrudo: unknown, timingDecimal: number): number | '' {
  const avance = Number(avanceCrudo);
  if (avanceCrudo == null || Number.isNaN(avance) || timingDecimal === 0) return '';
  if (avance >= timingDecimal) return 1;
  return avance / timingDecimal >= 0.8 ? 0 : -1;
}

/** Agrega a la fila del Ranking Comercial sus tres columnas de semáforo calculadas. */
export function conSemaforos(fila: Record<string, unknown>): Record<string, unknown> {
  const timing = fila['Timing'] ? Number(fila['Timing']) / 100 : 0;
  const calculadas = Object.fromEntries(
    AVANCES_RANKING_COMERCIAL.map(([origen, destino]) => [destino, semaforo(fila[origen], timing)]),
  );
  return { ...fila, ...calculadas };
}

/**
 * Un gráfico de Gestión Comercial.
 *
 * Estos bloques no traen su `{categories, series}` en `headers` como el resto:
 * el legado lo busca primero en `data[0]`, en el PRIMER campo de la fila (su
 * nombre cambia según el bloque), y solo cae a `headers` si `data` viene vacío.
 */
export function graficoGestionComercial(
  resultado: TablaRegularResultadoRaw | undefined,
  config: GraficoGestionComercial,
): BloqueGrafico & { formato: FormatoValor } {
  const { titulo, formato, apilado, esPorcentaje, esNivel, colorDeSerie } = config;
  const datos = parseGrafico(cargaUtilGrafico(resultado));
  if (!datos) return { titulo, formato, apilado, categorias: [], series: [] };

  return {
    titulo,
    formato,
    apilado,
    categorias: datos.categories ?? [],
    series: (datos.series ?? []).map((s) => {
      const nombre = s.name ?? '';
      const color = colorDeSerie?.(nombre);
      // El legado multiplica la TAPP por 100 y la rotula con "%"; ese "%" en el
      // nombre es lo que manda la serie al eje secundario como spline.
      if (esPorcentaje?.(nombre)) {
        const datos = (s.data ?? []).map((v) => (v == null ? v : v * 100));
        return { nombre: `${nombre} %`, datos, ...(color ? { color } : {}) };
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

/** `data[0][primer campo]` y, si no hay filas, `headers` — el orden del legado. */
function cargaUtilGrafico(resultado: TablaRegularResultadoRaw | undefined): unknown {
  const primeraFila = filasDeResultado(resultado)[0];
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

/** El payload llega serializado casi siempre, pero algunos bloques ya lo mandan como objeto. */
function parseGrafico(carga: unknown): DatosGraficoCrudo | undefined {
  if (carga && typeof carga === 'object') return carga as DatosGraficoCrudo;
  if (typeof carga !== 'string' || carga === '') return undefined;
  try {
    return JSON.parse(carga) as DatosGraficoCrudo;
  } catch {
    return undefined;
  }
}

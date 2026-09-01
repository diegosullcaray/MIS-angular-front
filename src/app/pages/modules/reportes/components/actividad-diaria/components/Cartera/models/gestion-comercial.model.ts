import type { ColumnaDinamica, TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { BloqueGrafico, FormatoValor } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

const decimal = { type: 'decimal' } as const;
const entero = { type: 'integer' } as const;
const porcentaje = { type: 'percent' } as const;

export const bgTrafficLightStyleFn = (val: unknown): Record<string, string> | undefined => {
  const num = Number(val);
  if (isNaN(num)) return undefined;
  if (num >= 1 || num >= 100) {
    return { 'background-color': '#dcfce7', color: '#166534', 'font-weight': 'bold' };
  } else if (num >= 0.8 || num >= 80) {
    return { 'background-color': '#fef08a', color: '#854d0e', 'font-weight': 'bold' };
  } else {
    return { 'background-color': '#fee2e2', color: '#991b1b', 'font-weight': 'bold' };
  }
};

export const colorThresholdStyleFnSaldo = (val: unknown): Record<string, string> | undefined => {
  const num = Number(val);
  if (isNaN(num)) return undefined;
  const limiteAmbarRojo = -1500000;
  if (num > 0) {
    return { 'background-color': '#dcfce7', color: '#166534', 'font-weight': 'bold' };
  } else if (num <= 0 && num > limiteAmbarRojo) {
    return { 'background-color': '#fef08a', color: '#854d0e', 'font-weight': 'bold' };
  } else {
    return { 'background-color': '#fee2e2', color: '#991b1b', 'font-weight': 'bold' };
  }
};

export const colorThresholdStyleFnCliente = (val: unknown): Record<string, string> | undefined => {
  const num = Number(val);
  if (isNaN(num)) return undefined;
  const limiteAmbarRojo = -200;
  if (num > 0) {
    return { 'background-color': '#dcfce7', color: '#166534', 'font-weight': 'bold' };
  } else if (num <= 0 && num > limiteAmbarRojo) {
    return { 'background-color': '#fef08a', color: '#854d0e', 'font-weight': 'bold' };
  } else {
    return { 'background-color': '#fee2e2', color: '#991b1b', 'font-weight': 'bold' };
  }
};

export const colorPosNegStyleFn = (val: unknown): Record<string, string> | undefined => {
  const num = Number(val);
  if (isNaN(num) || num === 0) return undefined;
  if (num < 0) return { color: '#ef4444', 'font-weight': 'bold' };
  return { color: '#22c55e', 'font-weight': 'bold' };
};

/**
 * `RS_GEST_COM_01` alimenta dos tablas con el mismo `data` y distintas
 * columnas: el legado las declara fijas en `tablaTab1` y `tablaTab2`.
 */
export const COLUMNAS_GESTION_PRODUCCION: ColumnaDinamica[] = [
  { key: 'descripcion', label: 'Descripción' },
  { key: 'prod_ind', label: 'Product.', format: decimal },
  { key: 'Percent_Cumpl', label: '% Cump. Prod', format: porcentaje, cellStyleFn: bgTrafficLightStyleFn },
  { key: 'TMMPROD', label: 'TMM Prod.', format: decimal, cellStyleFn: colorPosNegStyleFn },
  { key: 'mont_dese_2', label: 'Desemb.', format: entero },
  { key: 'percentcumpldesembolsometadi', label: '% Cump. Desemb.', format: porcentaje, cellStyleFn: bgTrafficLightStyleFn },
  { key: 'TMMDESEMB', label: 'TMM Desemb.', format: entero, cellStyleFn: colorPosNegStyleFn },
  { key: 'tick_prom_2', label: 'Ticket', format: entero },
  { key: 'TMM_TICK', label: 'TMM Ticket', format: decimal, cellStyleFn: colorPosNegStyleFn },
  { key: 'tapp_mes_2', label: 'TAPP', format: porcentaje },
  { key: 'TMMTAPP', label: 'TMM TAPP', format: decimal, cellStyleFn: colorPosNegStyleFn },
  { key: 'Canc_vigente', label: 'Canc. Vig.', format: entero },
  { key: 'HRODAM', label: 'Rodamiento', format: entero },
  { key: 'sal_vig_2', label: 'Saldo Vig.', format: entero },
  { key: 'HVSALVIGMN', label: 'Var. Saldo Vig.', format: entero, cellStyleFn: colorPosNegStyleFn },
  { key: 'hvalvar_10256', label: 'Meta Fecha VarSal', format: entero },
  { key: 'distdiariacartvig', label: 'Dist. Meta Fecha', format: entero, cellStyleFn: colorThresholdStyleFnSaldo },
  { key: 'hvalvar_9000', label: 'Meta Var. Saldo Vig.', format: entero },
];

export const COLUMNAS_GESTION_CLIENTES: ColumnaDinamica[] = [
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cli_stock_2', label: 'Cliente Stock', format: decimal },
  { key: 'TMMCLISTOCK', label: 'Var. clientes stock', format: decimal, cellStyleFn: colorPosNegStyleFn },
  { key: 'hvalvar_10257', label: 'Meta Fecha Var Clientes', format: decimal },
  { key: 'var_distancia_metadi', label: 'Dist. Meta Fecha', format: decimal, cellStyleFn: colorThresholdStyleFnCliente },
  { key: 'hvalvar_10062', label: 'Meta Var. Stock Cliente', format: entero },
  { key: 'HNUMCLIN', label: 'Clientes Nuevos', format: entero },
  { key: 'Percent_Cumpl_clinuevo', label: '% Cump. Nuevos', format: porcentaje, cellStyleFn: bgTrafficLightStyleFn },
  { key: 'TMMCLINUEV', label: 'TMM Clientes Nuevos', format: entero, cellStyleFn: colorPosNegStyleFn },
];

/**
 * Los seis gráficos activos, con el título y el orden del legado. Falta el
 * `GRAF_GEST_COM_03`, que ahí está comentado, y los dos "Ingresos y Salidas"
 * (`_04` y `_06`) repiten título a propósito: es el mismo gráfico con cortes
 * distintos.
 *
 * De cada uno solo se declara lo que `<app-grafico-mixto>` no puede deducir:
 * el `formato`, qué serie va en porcentaje sobre el eje secundario
 * (`esPorcentaje`), cuál es un NIVEL que va como spline en ese eje para no
 * compartir escala con su variación (`esNivel`), y el color que el legado fija
 * a mano (`colorDeSerie`; en hexadecimal, porque Highcharts no resuelve tokens
 * CSS). "Ingresos y Salidas" no lo declara: sus colores vienen en el payload.
 *
 * El orden importa: las dos tablas de variación no cuelgan de ninguna pestaña
 * sino que van intercaladas en este bloque, y el componente las inserta por
 * posición (ver `INDICE_TRAS_VAR_SALDO` e `INDICE_TRAS_VAR_CLIENTES`).
 */
export interface GraficoGestionComercial {
  codRep: string;
  titulo: string;
  formato: FormatoValor;
  apilado?: boolean;
  esPorcentaje?: (nombreSerie: string) => boolean;
  esNivel?: (nombreSerie: string) => boolean;
  colorDeSerie?: (nombreSerie: string) => string | undefined;
}

const sinVariacion = (nombre: string) => !nombre.toLowerCase().includes('var');

/** `prepareResumenChart()`: Desembolsos en columna, TAPP en línea sobre el eje secundario. */
const coloresDesembolsosDiarios = (nombre: string) => (nombre.toLowerCase().includes('tapp') ? '#3F51B5' : '#4DD0E1');

/** `prepareSaldoCarteraVigente()` / `prepareVariacionCliStockChart()`: mismo par nivel/variación en los dos evolutivos. */
const coloresNivelYVariacion = (nombre: string) => (sinVariacion(nombre) ? '#1565C0' : '#80DEEA');

/** `prepareVariacionStockChartT()`: tres colores según si el nombre trae "VARIACION", "META" o ninguno. */
function colorVariacionStockClientes(nombre: string): string {
  const mayus = nombre.toUpperCase();
  if (mayus.includes('VARIACION') && !mayus.includes('META')) return '#c5be97';
  if (mayus.includes('META')) return '#d4e157';
  return '#eef5b2';
}

export const GRAFICOS_GESTION_COMERCIAL: GraficoGestionComercial[] = [
  {
    codRep: 'GRAF_GEST_COM_01',
    titulo: 'Desembolsos Diarios',
    formato: 'soles',
    esPorcentaje: (nombre) => nombre.toLowerCase().includes('tapp'),
    colorDeSerie: coloresDesembolsosDiarios,
  },
  {
    codRep: 'GRAF_GEST_COM_05',
    titulo: 'Variación Stock Clientes',
    formato: 'numero',
    colorDeSerie: colorVariacionStockClientes,
  },
  {
    codRep: 'GRAF_GEST_COM_06',
    titulo: 'Ingresos y Salidas',
    formato: 'soles',
    apilado: true,
  },
  {
    codRep: 'GRAF_GEST_COM_02',
    titulo: 'Saldo Cartera Vigente',
    formato: 'soles',
    esNivel: sinVariacion,
    colorDeSerie: coloresNivelYVariacion,
  },
  // Acá va, por posición, la tabla "Var Saldo Cartera Vigente" (`RS_GEST_COM_02`).
  {
    codRep: 'GRAF_GEST_COM_07',
    titulo: 'Variación Cliente Stock',
    formato: 'numero',
    esNivel: sinVariacion,
    colorDeSerie: coloresNivelYVariacion,
  },
  {
    codRep: 'GRAF_GEST_COM_04',
    titulo: 'Ingresos y Salidas',
    formato: 'soles',
    apilado: true,
  },
  // Acá va, al final, la tabla "Var Clientes Stock" (`RS_GEST_COM_03`).
];

/** Índice (0-based) de `GRAFICOS_GESTION_COMERCIAL` tras el cual va cada tabla de variación. */
export const INDICE_TRAS_VAR_SALDO = 3;
export const INDICE_TRAS_VAR_CLIENTES = GRAFICOS_GESTION_COMERCIAL.length - 1;

/**
 * Los KPIs del encabezado — legado `setKpiValues()`, que los saca de la PRIMERA
 * FILA de `RS_GEST_COM_01` (la de totales), no de un bloque aparte.
 *
 * Se guardan en crudo, en la unidad que manda el backend; la división entre mil
 * o entre un millón la hace la plantilla, igual que el legado.
 */
export interface KpisGestionComercial {
  productividad: number;
  tmmProductividad: number;
  /** Ya multiplicado por 100 (el backend lo manda como fracción). */
  cumplProductividad: number;
  avanceProductividad: number;
  metaProductividad: number;

  ticket: number;
  tmmTicket: number;
  avanceTicket: number;
  metaTicket: number;

  desembolsos: number;
  tmmDesembolsos: number;
  cumplDesembolsos: number;
  avanceDesembolsos: number;
  metaDesembolsos: number;

  /** Calculado: desembolsos − variación de saldo vigente − rodamiento. */
  cancelacionVigente: number;
  /** El calculado sobre la meta de cancelación (`hvalvar_136`), en %. */
  avanceCancelacion: number;
  metaCancelacion: number;

  carteraVigente: number;
  varCarteraVigente: number;
  metaDiariaCarteraVigente: number;
  distanciaMetaCarteraVigente: number;

  rodamiento: number;
  tmmRodamiento: number;
  saldoNoVigente: number;
  tmmSaldoNoVigente: number;
  saldoVigente: number;
  tmmSaldoVigente: number;

  clientesStock: number;
  varClientesStock: number;
  avanceClientesStock: number;
  metaVarClientesStock: number;

  clientesNuevos: number;
  tmmClientesNuevos: number;
  cumplClientesNuevos: number;
  avanceClientesNuevos: number;
  metaClientesNuevos: number;
}

export const KPIS_GESTION_COMERCIAL_VACIOS: KpisGestionComercial = {
  productividad: 0, tmmProductividad: 0, cumplProductividad: 0, avanceProductividad: 0, metaProductividad: 0,
  ticket: 0, tmmTicket: 0, avanceTicket: 0, metaTicket: 0,
  desembolsos: 0, tmmDesembolsos: 0, cumplDesembolsos: 0, avanceDesembolsos: 0, metaDesembolsos: 0,
  cancelacionVigente: 0, avanceCancelacion: 0, metaCancelacion: 0,
  carteraVigente: 0, varCarteraVigente: 0, metaDiariaCarteraVigente: 0, distanciaMetaCarteraVigente: 0,
  rodamiento: 0, tmmRodamiento: 0, saldoNoVigente: 0, tmmSaldoNoVigente: 0, saldoVigente: 0, tmmSaldoVigente: 0,
  clientesStock: 0, varClientesStock: 0, avanceClientesStock: 0, metaVarClientesStock: 0,
  clientesNuevos: 0, tmmClientesNuevos: 0, cumplClientesNuevos: 0, avanceClientesNuevos: 0, metaClientesNuevos: 0,
};

/** Arma los KPIs desde la fila total de `RS_GEST_COM_01` — legado `setKpiValues()`. */
export function kpisDeFilaTotal(filas: readonly Record<string, unknown>[]): KpisGestionComercial {
  const fila = filas[0];
  if (!fila) return KPIS_GESTION_COMERCIAL_VACIOS;

  const num = (clave: string): number => {
    const valor = Number(fila[clave]);
    return Number.isFinite(valor) ? valor : 0;
  };
  /** Los avances y cumplimientos llegan como fracción y se pintan en %. */
  const pct = (clave: string): number => num(clave) * 100;

  const desembolsos = num('mont_dese_2');
  const varCarteraVigente = num('HVSALVIGMN');
  const rodamiento = num('HRODAM');
  const metaCancelacion = num('hvalvar_136');
  // El legado no lo pide al backend: lo despeja de los otros tres.
  const cancelacionVigente = desembolsos - varCarteraVigente - rodamiento;

  return {
    productividad: num('prod_ind'),
    tmmProductividad: num('TMMPROD'),
    cumplProductividad: pct('Percent_Cumpl'),
    avanceProductividad: pct('percent_avance_hoy'),
    metaProductividad: num('hvalvar_8070'),

    ticket: num('tick_prom_2'),
    tmmTicket: num('TMM_TICK'),
    avanceTicket: pct('percent_avance_ticket'),
    metaTicket: num('hvalvar_134'),

    desembolsos,
    tmmDesembolsos: num('TMMDESEMB'),
    cumplDesembolsos: pct('percentcumpldesembolsometadi'),
    avanceDesembolsos: pct('percent_avance_montode'),
    metaDesembolsos: num('hvalvar_133'),

    cancelacionVigente,
    avanceCancelacion: metaCancelacion === 0 ? 0 : (cancelacionVigente / metaCancelacion) * 100,
    metaCancelacion,

    carteraVigente: num('sal_vig_2'),
    varCarteraVigente,
    metaDiariaCarteraVigente: num('hvalvar_10256'),
    distanciaMetaCarteraVigente: num('distdiariacartvig'),

    rodamiento,
    tmmRodamiento: num('TMMRODAMIENTO'),
    saldoNoVigente: num('HSALNOVIG'),
    tmmSaldoNoVigente: num('TMMHSALNOVIG'),
    saldoVigente: num('HSALVIGEN'),
    tmmSaldoVigente: num('TMMSALVIGE'),

    clientesStock: num('cli_stock_2'),
    varClientesStock: num('TMMCLISTOCK'),
    avanceClientesStock: pct('percent_avance_cli_stock'),
    metaVarClientesStock: num('hvalvar_10062'),

    clientesNuevos: num('HNUMCLIN'),
    tmmClientesNuevos: num('TMMCLINUEV'),
    cumplClientesNuevos: pct('Percent_Cumpl_clinuevo'),
    avanceClientesNuevos: pct('percent_avance_cli_nuevos'),
    metaClientesNuevos: num('hvalvar_166'),
  };
}

/**
 * Semáforo de un cumplimiento (en %): verde desde el 100 %, ámbar desde el 80 %,
 * rojo por debajo — legado `obtenerClaseColor()`.
 *
 * OJO: el legado lo llama con dos escalas distintas (`kpi_perc_cumpl`, ya
 * multiplicado por 100, y `cumpldesembolsometadi`, en fracción) y adentro vuelve
 * a multiplicar, así que los cumplimientos que ya venían en % siempre le salían
 * verdes. Acá el helper recibe SIEMPRE el porcentaje y compara contra 100/80,
 * que es lo que la pantalla quiere decir.
 */
export function claseCumplimiento(porcentaje: number): string {
  if (porcentaje >= 100) return 'text-[var(--mis-success)]';
  if (porcentaje >= 80) return 'text-orange-500';
  return 'text-[var(--mis-danger)]';
}

export interface GestionComercialResultado {
  /** Mismo `data` de `RS_GEST_COM_01`, que se pinta con dos juegos de columnas. */
  filas: Record<string, unknown>[];
  /** `RS_GEST_COM_02` — "Var Saldo Cartera Vigente"; trae sus propias cabeceras. */
  varSaldoVigente: TablaDinamicaResultado;
  /** `RS_GEST_COM_03` — "Var Clientes Stock"; ídem. */
  varClientesStock: TablaDinamicaResultado;
  /** Las tarjetas del encabezado, sacadas de la fila total de `RS_GEST_COM_01`. */
  kpis: KpisGestionComercial;
  /** Cada gráfico ya listo para `<app-grafico-mixto>`, con su formato de tooltip. */
  graficos: (BloqueGrafico & { formato: FormatoValor })[];
}

export const GESTION_COMERCIAL_VACIA: GestionComercialResultado = {
  filas: [],
  varSaldoVigente: { columnas: [], filas: [] },
  varClientesStock: { columnas: [], filas: [] },
  kpis: KPIS_GESTION_COMERCIAL_VACIOS,
  graficos: [],
};

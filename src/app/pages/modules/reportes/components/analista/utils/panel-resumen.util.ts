import { formatearCeldaReporte } from '../../../../../../shared/ui/tablas/tabla-reporte/formato-celda.util';
import { TABLA_PENDIENTE, type ColumnaReporte, type FilaReporte, type TablaReporteResultado } from '../../../models/tabla-reporte.model';
import { semaforo } from '../../../utils/semaforo.util';
import { CODIGO_CLIENTES_CONSOLIDADO, CODIGO_EFECTIVIDADES } from '../constantes/panel-asesor.constantes';
import type {
  BarraPanel,
  DominioPanel,
  MetricaPanel,
  ResultadoPanelAsesor,
  ResumenDominio,
  TonoPanel,
} from '../models/panel-asesor.model';
import { CLAVES_TABLA, columnasDato } from './panel-asesor.util';

// Cifras del panel leídas de las tablas reales: fila por su nombre, columna por su encabezado.
// Lo que no llega queda en "—".

/** Resultados listos por `SCODSEC`; los que aún cargan o fallaron no están. */
export type ResultadosPanel = Readonly<Partial<Record<string, ResultadoPanelAsesor>>>;

const SIN_DATO = '—';

/** Texto comparable: sin tildes, en minúsculas, con el signo menos unificado y sin puntuación. */
export function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[^a-z0-9%<>=+-]+/g, ' ')
    .trim();
}

/** Número de una celda (`number`, con el porcentaje en fracción, o texto como "−274,224"). */
export function numeroDe(valor: unknown, columna?: ColumnaReporte): number | null {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return null;
    return columna?.format?.['type'] === 'percent' ? valor * 100 : valor;
  }
  if (typeof valor !== 'string') return null;
  const limpio = valor.replace(/[−–]/g, '-').replace(/[,\s]/g, '');
  const m = /^\(?([-+]?\d+(?:\.\d+)?)/.exec(limpio);
  if (!m) return null;
  const n = Number(m[1]);
  return limpio.startsWith('(') ? -Math.abs(n) : n;
}

interface FilaHallada {
  fila: FilaReporte;
  columnas: ColumnaReporte[];
}

interface Cifra {
  texto: string;
  numero: number | null;
}

function tablasDe(resultado: ResultadoPanelAsesor | undefined): TablaReporteResultado[] {
  if (!resultado) return [];
  return CLAVES_TABLA.map((c) => resultado[c]).filter(
    (t): t is TablaReporteResultado => !!t && t !== TABLA_PENDIENTE,
  );
}

/** Primera fila cuya etiqueta (primera columna) cumple el patrón. */
export function hallarFila(tablas: readonly TablaReporteResultado[], patron: RegExp): FilaHallada | null {
  for (const tabla of tablas) {
    const columnas = columnasDato(tabla);
    const etiqueta = columnas[0];
    if (!etiqueta) continue;
    const fila = tabla.body.find((f) => patron.test(normalizar(f[etiqueta.columnDef])));
    if (fila) return { fila, columnas };
  }
  return null;
}

/** Celda de una fila, por encabezado o por posición entre las columnas de valor. */
export function cifra(hallada: FilaHallada | null, columna: RegExp | number): Cifra | null {
  if (!hallada) return null;
  const valores = hallada.columnas.slice(1);
  const col =
    typeof columna === 'number' ? valores[columna] : valores.find((c) => columna.test(normalizar(c.header)));
  if (!col) return null;
  const valor = hallada.fila[col.columnDef];
  if (valor === null || valor === undefined || valor === '') return null;
  return { texto: formatearCeldaReporte(valor, col), numero: numeroDe(valor, col) };
}

const COL = {
  cierre: /cierre|anterior/,
  actual: /ejecutado|a hoy|actual|real/,
  variacion: /variacion|var$|dif/,
  total: /^total$/,
};

/** Menos tipográfico y "+" en las subidas. */
function conSigno(c: Cifra | null): string | undefined {
  if (!c) return undefined;
  const texto = c.texto.replace(/^-/, '−');
  return c.numero !== null && c.numero > 0 && !texto.startsWith('+') ? `+${texto}` : texto;
}

function tonoPorSigno(n: number | null | undefined, subirEsBueno: boolean): TonoPanel {
  if (n === null || n === undefined || n === 0) return 'neutro';
  return n > 0 === subirEsBueno ? 'bien' : 'mal';
}

/** Valor actual y variación contra el cierre. */
function metricaComparada(
  etiqueta: string,
  hallada: FilaHallada | null,
  subirEsBueno: boolean,
  contexto = '',
): MetricaPanel {
  const actual = cifra(hallada, COL.actual) ?? cifra(hallada, 1);
  const variacion = cifra(hallada, COL.variacion);
  const detalle = variacion ? `${conSigno(variacion)}${contexto}` : undefined;
  return { etiqueta, valor: actual?.texto ?? SIN_DATO, detalle, tono: tonoPorSigno(variacion?.numero, subirEsBueno) };
}

function porcentajeDe(n: number | null, maximo: number): number {
  if (n === null || maximo <= 0) return 0;
  return Math.max(0, Math.min(100, (Math.abs(n) / maximo) * 100));
}

/** "ago." */
function mesCorto(fecha: Date): string {
  return fecha.toLocaleString('es-PE', { month: 'short' }).replace(/\.?$/, '.');
}

// ── Cartera ────────────────────────────────────────────────────────────────

function resumenCartera(r: ResultadosPanel, corte: Date): ResumenDominio {
  const t = tablasDe(r['L_CART_SEC']);
  const stock = hallarFila(t, /^stock de cartera/);
  const cierre = cifra(stock, COL.cierre);
  const hoy = cifra(stock, COL.actual);
  const variacion = cifra(stock, COL.variacion);
  const maximo = Math.max(Math.abs(cierre?.numero ?? 0), Math.abs(hoy?.numero ?? 0));
  const mesAnterior = new Date(corte.getFullYear(), corte.getMonth() - 1, 1);

  const barras: BarraPanel[] =
    cierre || hoy
      ? [
          { etiqueta: `Cierre ${mesCorto(mesAnterior)}`, valor: cierre?.texto ?? SIN_DATO, porcentaje: porcentajeDe(cierre?.numero ?? null, maximo), tono: 'referencia' },
          { etiqueta: 'Hoy', valor: hoy?.texto ?? SIN_DATO, porcentaje: porcentajeDe(hoy?.numero ?? null, maximo), tono: 'neutro' },
        ]
      : [];
  const saldoMedio = hallarFila(t, /^saldo medio de cartera/);
  const tappStock = hallarFila(t, /^tapp stock/);
  const tappMes = hallarFila(t, /^tapp mes/);

  return {
    barras,
    lista: [],
    pie: [
      metricaComparada('Saldo medio', saldoMedio, true),
      metricaComparada('TAPP stock', tappStock, true),
      metricaComparada('TAPP mes', tappMes, true),
    ],
    indicadores: [
      { etiqueta: 'Stock de cartera', valor: hoy?.texto ?? SIN_DATO, detalle: variacion ? `${conSigno(variacion)} vs cierre` : undefined, tono: tonoPorSigno(variacion?.numero, true) },
      metricaComparada('Saldo medio de cartera', saldoMedio, true),
      metricaComparada('TAPP stock', tappStock, true),
      metricaComparada('TAPP mes', tappMes, true),
    ],
  };
}

// ── Clientes ───────────────────────────────────────────────────────────────

function resumenClientes(r: ResultadosPanel): ResumenDominio {
  const consolidado = r[CODIGO_CLIENTES_CONSOLIDADO];
  const t = tablasDe(consolidado);
  const nuevos = hallarFila(t, /^(numero de |nro de )?clientes nuevos/);
  const recurrentes = hallarFila(t, /^(numero de |nro de )?clientes recurrentes/);
  const ticket = hallarFila(t, /^ticket promedio de clientes desembolsados/);

  // Clientes por producto a hoy, sin filas de total.
  const productos = [consolidado?.tabla3, consolidado?.tabla4, consolidado?.tabla5]
    .filter((x): x is TablaReporteResultado => !!x && x !== TABLA_PENDIENTE)
    .flatMap((tabla) => {
      const columnas = columnasDato(tabla);
      const etiqueta = columnas[0];
      if (!etiqueta) return [];
      return tabla.body
        .filter((f) => !/^total/.test(normalizar(f[etiqueta.columnDef])))
        .map((fila) => {
          const c = cifra({ fila, columnas }, COL.actual);
          return { nombre: String(fila[etiqueta.columnDef] ?? ''), texto: c?.texto ?? SIN_DATO, numero: c?.numero ?? 0 };
        });
    })
    .sort((a, b) => b.numero - a.numero);
  const principales = productos.slice(0, 3);
  const resto = productos.slice(3);
  if (resto.length) {
    const suma = resto.reduce((s, p) => s + p.numero, 0);
    principales.push({ nombre: 'Otros', texto: new Intl.NumberFormat('es-PE').format(suma), numero: suma });
  }
  const maximo = Math.max(0, ...principales.map((p) => p.numero));

  const stockClientes = hallarFila(tablasDe(r['L_CART_SEC']), /^stock de clientes/);
  const nuevosM = metricaComparada('Nuevos', nuevos, true);
  if (cifra(nuevos, COL.variacion)?.numero === 0) nuevosM.detalle = '= cierre';

  return {
    tituloBarras: principales.length ? 'Clientes por producto, a hoy' : undefined,
    barras: principales.map((p) => ({ etiqueta: p.nombre, valor: p.texto, porcentaje: porcentajeDe(p.numero, maximo), tono: 'neutro' })),
    lista: [],
    pie: [nuevosM, metricaComparada('Recurrentes', recurrentes, true), metricaComparada('Ticket prom.', ticket, true)],
    indicadores: [
      metricaComparada('Stock de clientes', stockClientes, true),
      metricaComparada('Clientes nuevos', nuevos, true),
      metricaComparada('Clientes recurrentes', recurrentes, true),
      metricaComparada('Ticket prom. desembolsados', ticket, true),
    ],
  };
}

// ── Colocación ─────────────────────────────────────────────────────────────

/** Último dato de la columna (el monitor crece día a día). */
function ultimaCifra(tabla: TablaReporteResultado | undefined, columna: RegExp): Cifra | null {
  if (!tabla || tabla === TABLA_PENDIENTE) return null;
  const columnas = columnasDato(tabla);
  const col = columnas.slice(1).find((c) => columna.test(normalizar(c.header)));
  if (!col) return null;
  for (let i = tabla.body.length - 1; i >= 0; i--) {
    const valor = tabla.body[i][col.columnDef];
    if (valor !== null && valor !== undefined && valor !== '') {
      return { texto: formatearCeldaReporte(valor, col), numero: numeroDe(valor, col) };
    }
  }
  return null;
}

/** Tono del avance contra los días hábiles transcurridos. */
function tonoAvance(avance: number | null, ritmo: number | null, estiloMotor: string | undefined): TonoPanel {
  const s = semaforo(estiloMotor);
  if (s === 1) return 'bien';
  if (s === 0) return 'revisar';
  if (s === -1) return 'mal';
  if (avance === null) return 'neutro';
  const meta = ritmo ?? 100;
  return avance >= meta ? 'bien' : avance >= meta / 2 ? 'revisar' : 'mal';
}

function resumenColocacion(r: ResultadosPanel): ResumenDominio {
  const m = r['L_MONI_DESE_SEC'];
  const kpiOps = m?.kpiOperaciones?.cumpl_des_acum;
  const kpiMonto = m?.kpiMonto?.cumpl_ope_acum;
  const ops = kpiOps ? { texto: kpiOps, numero: numeroDe(kpiOps) } : null;
  const monto = kpiMonto ? { texto: kpiMonto, numero: numeroDe(kpiMonto) } : null;
  const dias = ultimaCifra(m?.tabla1, /dias/) ?? ultimaCifra(m?.tabla2, /dias/);
  const marca = dias?.numero ?? null;
  const opsAcum = ultimaCifra(m?.tabla1, /ops? acum|operaciones acum/);
  const metaAcum = ultimaCifra(m?.tabla1, /meta acum/);
  const tasas = tablasDe(r['L_REP_AUTO_SEC']);
  const desembolsado = cifra(hallarFila(tasas, /^monto desembolsado$/), COL.total);
  const ticket = cifra(hallarFila(tasas, /^ticket promedio/), COL.total);

  const tonoOps = tonoAvance(ops?.numero ?? null, marca, m?.kpiOperaciones?.style_cumpl_des_acum);
  const tonoMonto = tonoAvance(monto?.numero ?? null, marca, m?.kpiMonto?.style_cumpl_ope_acum);
  const barras: BarraPanel[] = [];
  if (ops) barras.push({ etiqueta: 'Operaciones', valor: ops.texto, porcentaje: porcentajeDe(ops.numero, 100), tono: tonoOps, marca });
  if (monto) barras.push({ etiqueta: 'Monto', valor: monto.texto, porcentaje: porcentajeDe(monto.numero, 100), tono: tonoMonto, marca });

  return {
    barras,
    notaBarras: marca !== null && barras.length ? `Días hábiles transcurridos (${dias!.texto})` : undefined,
    lista: [],
    pie: [
      { etiqueta: 'Ops / meta', valor: opsAcum || metaAcum ? `${opsAcum?.texto ?? SIN_DATO} / ${metaAcum?.texto ?? SIN_DATO}` : SIN_DATO, tono: 'neutro' },
      { etiqueta: 'Desembolsado', valor: desembolsado?.texto ?? SIN_DATO, tono: 'neutro' },
      { etiqueta: 'Ticket', valor: ticket?.texto ?? SIN_DATO, tono: 'neutro' },
    ],
    indicadores: [
      { etiqueta: 'Cumplimiento operaciones', valor: ops?.texto ?? SIN_DATO, detalle: opsAcum && metaAcum ? `${opsAcum.texto} de ${metaAcum.texto} operaciones` : undefined, tono: tonoOps },
      { etiqueta: 'Cumplimiento monto', valor: monto?.texto ?? SIN_DATO, tono: tonoMonto },
      { etiqueta: 'Monto desembolsado', valor: desembolsado?.texto ?? SIN_DATO, detalle: ticket ? `Ticket ${ticket.texto}` : undefined, tono: 'neutro' },
      { etiqueta: 'Días hábiles transcurridos', valor: dias?.texto ?? SIN_DATO, tono: 'neutro' },
    ],
  };
}

// ── Autonomía de tasas ────────────────────────────────────────────────────

function resumenTasas(r: ResultadosPanel): ResumenDominio {
  const t = tablasDe(r['L_REP_AUTO_SEC']);
  const distancia = cifra(hallarFila(t, /^distancia/), COL.total);
  const tappMes = cifra(hallarFila(t, /^tapp mes/), COL.total);
  const tappMinima = cifra(hallarFila(t, /^tapp minima/), COL.total);
  const operaciones = hallarFila(t, /^nro operaciones$|^numero de operaciones$|^nro de operaciones$/);
  const operacionesPct = hallarFila(t, /^nro operaciones %|^numero de operaciones %|^nro de operaciones %/);
  const monto = cifra(hallarFila(t, /^monto desembolsado$/), COL.total);
  const ticket = cifra(hallarFila(t, /^ticket promedio/), COL.total);
  const maximo = Math.max(tappMes?.numero ?? 0, tappMinima?.numero ?? 0);
  const textoDistancia = distancia ? `${conSigno(distancia)}${/pbs/.test(distancia.texto) ? '' : ' pbs'}` : null;
  const bajoMinima = (distancia?.numero ?? 0) < 0;

  return {
    destacado: textoDistancia ? { valor: textoDistancia, texto: 'distancia a la TAPP mínima' } : null,
    barras:
      tappMes || tappMinima
        ? [
            { etiqueta: 'TAPP mínima', valor: tappMinima?.texto ?? SIN_DATO, porcentaje: porcentajeDe(tappMinima?.numero ?? null, maximo), tono: 'referencia' },
            { etiqueta: 'TAPP mes', valor: tappMes?.texto ?? SIN_DATO, porcentaje: porcentajeDe(tappMes?.numero ?? null, maximo), tono: bajoMinima ? 'revisar' : 'bien' },
          ]
        : [],
    lista: [],
    pie: [
      { etiqueta: 'Operaciones', valor: cifra(operaciones, COL.total)?.texto ?? SIN_DATO, tono: 'neutro' },
      { etiqueta: 'Por Administrador', valor: cifra(operacionesPct, /administr/)?.texto ?? SIN_DATO, tono: 'neutro' },
      { etiqueta: 'Encima mínima', valor: cifra(operaciones, /encima/)?.texto ?? SIN_DATO, tono: 'neutro' },
    ],
    indicadores: [
      { etiqueta: 'Operaciones', valor: cifra(operaciones, COL.total)?.texto ?? SIN_DATO, tono: 'neutro' },
      { etiqueta: 'Monto desembolsado', valor: monto?.texto ?? SIN_DATO, detalle: ticket ? `Ticket ${ticket.texto}` : undefined, tono: 'neutro' },
      { etiqueta: 'TAPP mes vs mínima', valor: tappMes?.texto ?? SIN_DATO, detalle: tappMinima ? `Mínima ${tappMinima.texto}` : undefined, tono: distancia ? (bajoMinima ? 'revisar' : 'bien') : 'neutro' },
      { etiqueta: 'Distancia', valor: textoDistancia ?? SIN_DATO, detalle: distancia ? (bajoMinima ? 'Bajo la TAPP mínima' : 'Sobre la TAPP mínima') : undefined, tono: distancia ? (bajoMinima ? 'mal' : 'bien') : 'neutro' },
    ],
  };
}

// ── Seguros ────────────────────────────────────────────────────────────────

function resumenSeguros(r: ResultadosPanel): ResumenDominio {
  const t = tablasDe(r['L_SEG_SEC']);
  const mes = hallarFila(t, /^multiriesgo.*mes/);
  const stock = hallarFila(t, /^multiriesgo.*stock/);
  const cuota = hallarFila(t, /^mult.*credito.*stock/);
  const agro = hallarFila(t, /agropecuario.*stock/);
  const mesActual = cifra(mes, COL.actual);
  const mesAnterior = cifra(mes, COL.cierre);
  const fila = (etiqueta: string, h: FilaHallada | null): MetricaPanel => {
    const m = metricaComparada(etiqueta, h, true);
    return m.valor === SIN_DATO ? { ...m, valor: 'sin dato', detalle: undefined } : m;
  };

  return {
    destacado: mesActual
      ? { valor: mesActual.texto, texto: `pólizas Multiriesgo en el mes${mesAnterior ? ` (${mesAnterior.texto} el mes anterior)` : ''}` }
      : null,
    barras: [],
    lista: [fila('Multiriesgo · stock', stock), fila('Mult. crédito y protec. cuota · stock', cuota), fila('Agropecuarios · stock', agro)],
    pie: [],
    indicadores: [
      metricaComparada('Multiriesgo · mes', mes, true, ' vs cierre'),
      metricaComparada('Multiriesgo · stock', stock, true, ' vs cierre'),
      metricaComparada('Protec. cuota · stock', cuota, true, ' vs cierre'),
      fila('Agropecuarios', agro),
    ],
  };
}

// ── Recuperación y mora ───────────────────────────────────────────────────

function tonoEfectividad(n: number | null): TonoPanel {
  if (n === null) return 'neutro';
  return n >= 90 ? 'bien' : n >= 50 ? 'revisar' : 'mal';
}

function resumenMora(r: ResultadosPanel): ResumenDominio {
  const cartera = tablasDe(r['L_CART_SEC']);
  const efectividad0 = cifra(hallarFila(cartera, /efectividad.*-30 a 0/), COL.actual);
  const efectividad30 = cifra(hallarFila(cartera, /efectividad.*(^|[^-\d])1 a 30/), COL.actual);
  const enMora = hallarFila(cartera, /^numero de clientes en mora/);
  const saldo30 = hallarFila(cartera, /^saldo en mora tramo 1 a 30/);

  // Preventiva: una fila por cliente; se cuentan y se suma su saldo.
  const preventiva = tablasDe(r['L_REC_PREVE_SEC'])[0];
  let preventivaM: MetricaPanel = { etiqueta: 'Preventiva', valor: SIN_DATO, tono: 'neutro' };
  if (preventiva) {
    const columnas = columnasDato(preventiva);
    const etiqueta = columnas[0];
    const filas = preventiva.body.filter((f) => !etiqueta || !/^total/.test(normalizar(f[etiqueta.columnDef])));
    const colSaldo = columnas.slice(1).find((c) => /saldo/.test(normalizar(c.header)));
    const suma = colSaldo ? filas.reduce((s, f) => s + (numeroDe(f[colSaldo.columnDef], colSaldo) ?? 0), 0) : null;
    preventivaM = {
      etiqueta: 'Preventiva',
      valor: `${filas.length} ${filas.length === 1 ? 'cliente' : 'clientes'}`,
      detalle: suma !== null ? `${new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(suma)} saldo` : undefined,
      tono: filas.length ? 'revisar' : 'neutro',
    };
  }

  const barras: BarraPanel[] = [];
  if (efectividad0) barras.push({ etiqueta: '−30 a 0 días', valor: efectividad0.texto, porcentaje: porcentajeDe(efectividad0.numero, 100), tono: tonoEfectividad(efectividad0.numero) });
  if (efectividad30) barras.push({ etiqueta: '1 a 30 días', valor: efectividad30.texto, porcentaje: porcentajeDe(efectividad30.numero, 100), tono: tonoEfectividad(efectividad30.numero) });

  return {
    tituloBarras: barras.length ? 'Ratio de efectividad por tramo' : undefined,
    barras,
    lista: [],
    pie: [metricaComparada('Clientes en mora', enMora, false), metricaComparada('Saldo 1–30 días', saldo30, false), preventivaM],
    indicadores: [
      metricaComparada('Ratio de mora real', hallarFila(cartera, /^ratio de mora real/), false),
      metricaComparada('Ratio de mora > 1 día', hallarFila(cartera, /^ratio de mora (>|mayor)/), false),
      metricaComparada('Clientes en mora', enMora, false, ' vs cierre'),
      { etiqueta: 'Efectividad −30 a 0', valor: efectividad0?.texto ?? SIN_DATO, detalle: efectividad30 ? `Tramo 1–30: ${efectividad30.texto}` : undefined, tono: tonoEfectividad(efectividad0?.numero ?? null) },
    ],
  };
}

/** Reportes que alimentan cada tarjeta. */
export const FUENTES_DOMINIO: Readonly<Record<DominioPanel, readonly string[]>> = {
  cartera: ['L_CART_SEC'],
  clientes: [CODIGO_CLIENTES_CONSOLIDADO, 'L_CART_SEC'],
  colocacion: ['L_MONI_DESE_SEC', 'L_REP_AUTO_SEC'],
  tasas: ['L_REP_AUTO_SEC'],
  seguros: ['L_SEG_SEC'],
  mora: ['L_CART_SEC', CODIGO_EFECTIVIDADES, 'L_REC_PREVE_SEC'],
};

/** Resumen de una tarjeta con lo que ya llegó. */
export function resumenDominio(dominio: DominioPanel, r: ResultadosPanel, corte: Date): ResumenDominio {
  switch (dominio) {
    case 'cartera':
      return resumenCartera(r, corte);
    case 'clientes':
      return resumenClientes(r);
    case 'colocacion':
      return resumenColocacion(r);
    case 'tasas':
      return resumenTasas(r);
    case 'seguros':
      return resumenSeguros(r);
    case 'mora':
      return resumenMora(r);
  }
}

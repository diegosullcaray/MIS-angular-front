import type { ColumnaDinamica } from '../../../models/tabla-dinamica.model';
import type { TablaRegularResultadoRaw } from '../../../models/tabla-dinamica.model';
import {
  CUENTAS_GASTO_CUENTA_RESULTADOS,
  MENSAJES_CUENTA_RESULTADOS,
} from '../constantes/actividad-mensual.constantes';
import type {
  CuentaResultadoFila,
  CuentaResultadosResultado,
  MetadatosCuentaResultados,
} from '../models/cuenta-resultados.model';

/**
 * Mapeo de Cuenta de Resultados (`TAB_CUE_RES_01`). Contrato y reglas copiados
 * del legado `repositorio/cuenta-resultados/cuenta-resultados.{component,util}.ts`.
 */

/** Payload que no cumple el contrato: su mensaje es el que ve la persona usuaria. */
export class ContratoCuentaResultadosError extends Error {}

/** `YYYY-MM-DD` de calendario válido, o `null` — `normalizeReportDate()` del legado. */
export function normalizarFechaCuenta(valor: unknown): string | null {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const valida = fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  return valida ? valor : null;
}

/** `YYYYMMDD`, el formato que espera el parámetro `fecha` — `toBackendDate()` del legado. */
export function fechaCuentaParaBackend(valor: unknown): string | null {
  const normalizada = normalizarFechaCuenta(valor);
  return normalizada ? normalizada.replaceAll('-', '') : null;
}

function capitalizar(texto: string): string {
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

function fechaLocal(valor: string): Date {
  return new Date(`${valor}T00:00:00`);
}

/** "Junio de 2026" — `formatPeriodLabel()` del legado. */
export function etiquetaPeriodoCuenta(valor: string): string {
  return capitalizar(fechaLocal(valor).toLocaleString('es-PE', { month: 'long', year: 'numeric' }));
}

/** Metadatos de `resultado.headers`, o `null` si no cumplen el contrato — `parseMetadata()` del legado. */
export function leerMetadatosCuenta(crudo: unknown): MetadatosCuentaResultados | null {
  let metadatos: { preliminar?: unknown; fechas?: unknown };
  try {
    metadatos = typeof crudo === 'string' ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
  if (!metadatos || (metadatos.preliminar !== 0 && metadatos.preliminar !== 1)) return null;
  const fechas = metadatos.fechas;
  if (!Array.isArray(fechas) || !fechas.length || fechas.some((f) => !normalizarFechaCuenta(f))) return null;
  return { preliminar: metadatos.preliminar, fechas: fechas as string[] };
}

/**
 * Convierte `resultado` en lo que dibuja la pantalla. Si la fecha pedida no
 * figura entre los periodos devueltos (p. ej. se pidió `NOW`), las cifras son
 * del primero. Lanza `ContratoCuentaResultadosError` ante un payload inválido.
 */
export function mapearCuentaResultados(
  resultado: TablaRegularResultadoRaw | undefined,
  fechaPedida: string | null,
): CuentaResultadosResultado {
  const metadatos = leerMetadatosCuenta(resultado?.headers);
  if (!metadatos) throw new ContratoCuentaResultadosError(MENSAJES_CUENTA_RESULTADOS.metadatosInvalidos);
  if (!Array.isArray(resultado?.data)) {
    throw new ContratoCuentaResultadosError(MENSAJES_CUENTA_RESULTADOS.respuestaInvalida);
  }

  const periodos = metadatos.fechas.map((fecha) => ({ id: fecha, desc: etiquetaPeriodoCuenta(fecha) }));
  const fecha = metadatos.fechas.find((f) => f === fechaPedida) ?? metadatos.fechas[0];
  const preliminar = metadatos.preliminar === 1;
  return {
    periodos,
    fecha,
    preliminar,
    columnas: crearColumnasCuentaResultados(fecha, preliminar),
    filas: resultado.data as CuentaResultadoFila[],
  };
}

function nivel(fila: Record<string, unknown>): number {
  return Number(fila['style']);
}

/**
 * Estilo por nivel de cuenta, como la maqueta de PYG (`governance/tasks/image.png`): el resultado
 * (3: márgenes y resultados) en banda navy con texto claro, la cuenta principal (2) en el fondo
 * claro de marca y el detalle en la superficie, con texto secundario.
 */
export function estiloFilaCuenta(fila: Record<string, unknown>): Record<string, string> {
  switch (nivel(fila)) {
    case 3:
      return { background: 'var(--mis-primary)', color: 'var(--mis-text-on-primary)', 'font-weight': '800' };
    case 2:
      return { background: 'var(--mis-primary-light)', color: 'var(--mis-primary-text)', 'font-weight': '800' };
    default:
      return { background: 'var(--mis-surface)', color: 'var(--mis-text-secondary)', 'font-weight': '500' };
  }
}

/** Sangría de la cuenta según su nivel — `accountCellStyle()` del legado. */
function sangriaCuenta(fila: Record<string, unknown>): string {
  switch (nivel(fila)) {
    case 1:
      return '30px';
    case 4:
      return '50px';
    case 5:
      return '90px';
    default:
      return '12px';
  }
}

/**
 * Color del punto de la variación: en cuentas de gasto bajar es favorable; en el
 * resto, subir. El cero cuenta como favorable — `trafficColor()` del legado.
 */
export function colorVariacionCuenta(valor: number, fila: Record<string, unknown>): string {
  const esGasto = CUENTAS_GASTO_CUENTA_RESULTADOS.includes(String(fila['cuenta_codigo']));
  const favorable = esGasto ? valor <= 0 : valor >= 0;
  const color = favorable ? 'var(--mis-success)' : 'var(--mis-danger)';
  // Sobre la banda navy del resultado el tono de marca se pierde: se aclara (`softColors` del legado).
  return nivel(fila) === 3 ? `color-mix(in srgb, ${color} 55%, white)` : color;
}

/**
 * La columna fija pasa por encima de las cifras al desplazar en horizontal: su fondo tiene que
 * tapar. Algunos niveles usan un tono translúcido (`--mis-hover-bg`), así que se apila sobre la
 * superficie sólida.
 */
export function fondoOpaco(fondo: string | undefined): string {
  return fondo ? `linear-gradient(${fondo}, ${fondo}), var(--mis-surface)` : 'var(--mis-surface)';
}

/** Columna fija de cuentas; en un teléfono se acota para que no tape las cifras. */
const ESTILO_CUENTA_FIJA = {
  position: 'sticky',
  left: '0',
  'min-width': 'min(290px, 40vw)',
  width: 'min(290px, 40vw)',
  'white-space': 'normal',
};

/** Encabezado de una cifra: compacto y a la derecha, como su valor. */
const ENCABEZADO_CIFRA = { 'text-align': 'right', padding: '4px 8px' };

/** "Preliminar Ago": el mes aún abierto va resaltado, como en la maqueta. */
const ENCABEZADO_PRELIMINAR = {
  ...ENCABEZADO_CIFRA,
  background: 'var(--mis-warning-light)',
  color: 'var(--mis-warning)',
};

function columnaCifra(label: string, key: string, extra: Partial<ColumnaDinamica> = {}): ColumnaDinamica {
  return {
    label,
    key,
    format: { type: 'integer' },
    style: ENCABEZADO_CIFRA,
    cellStyle: { 'text-align': 'right' },
    cellStyleFn: (_valor, fila) => estiloFilaCuenta(fila),
    ...extra,
  };
}

/** Variación con el punto verde/rojo a la izquierda y la cifra con su signo. */
function columnaVariacion(label: string, key: string, tipo: 'integer' | 'percent' = 'integer'): ColumnaDinamica {
  return columnaCifra(label, key, {
    format: { type: tipo },
    colorVariacion: colorVariacionCuenta,
    indicadorVariacion: 'punto',
  });
}

/** "Ago" — mes abreviado sin punto, como `toLocaleString('es-PE', { month: 'short' })` del legado. */
function mesCorto(fecha: Date): string {
  return capitalizar(fecha.toLocaleString('es-PE', { month: 'short' }).replace('.', ''));
}

function anioCorto(anio: number): string {
  return String(anio).slice(-2);
}

/** "Ago.26" */
function mesAnio(fecha: Date): string {
  return `${mesCorto(fecha)}.${anioCorto(fecha.getFullYear())}`;
}

/**
 * Columnas relativas al periodo elegido, con el encabezado de la maqueta de PYG: "PYG {nivel}" sobre
 * todas las cifras; debajo, los tres meses agrupados por año (el del año anterior, el mes anterior y
 * el actual, "Preliminar" si aún no cierra), su variación, los acumulados y sus variaciones.
 */
export function crearColumnasCuentaResultados(fecha: string, preliminar: boolean, nivel?: string): ColumnaDinamica[] {
  const actual = fechaLocal(fecha);
  const anterior = new Date(actual.getFullYear(), actual.getMonth() - 1, 1);
  const anioAnterior = new Date(actual.getFullYear() - 1, actual.getMonth(), 1);
  const mes = mesCorto(actual);

  const meses: [Date, ColumnaDinamica][] = [
    [anioAnterior, columnaCifra(mesCorto(anioAnterior), 'periodo_anio_anterior')],
    [anterior, columnaCifra(mesCorto(anterior), 'periodo_anterior')],
    [
      actual,
      preliminar
        ? columnaCifra(`Preliminar ${mes}`, 'periodo_actual', { style: ENCABEZADO_PRELIMINAR })
        : columnaCifra(mes, 'periodo_actual'),
    ],
  ];
  // Meses consecutivos del mismo año comparten el encabezado del año (en enero, el mes anterior es del año pasado).
  const porAnio: ColumnaDinamica[] = [];
  for (const [f, columna] of meses) {
    const anio = String(f.getFullYear());
    const grupo = porAnio.at(-1);
    if (grupo?.label === anio) grupo.subs!.push(columna);
    else porAnio.push({ label: anio, key: `anio_${porAnio.length}_${anio}`, subs: [columna] });
  }

  return [
    {
      label: 'Estado de ganancias y pérdidas · en miles (PEN)',
      key: 'cuenta_nombre',
      style: { ...ESTILO_CUENTA_FIJA, 'z-index': '3', 'text-align': 'left' },
      cellStyle: { ...ESTILO_CUENTA_FIJA, 'z-index': '1', 'text-align': 'left' },
      cellStyleFn: (_valor, fila) => {
        const estilo = estiloFilaCuenta(fila);
        return { ...estilo, background: fondoOpaco(estilo['background']), 'padding-left': sangriaCuenta(fila) };
      },
    },
    {
      label: nivel ? `PYG ${nivel}` : 'PYG',
      key: 'pyg',
      subs: [
        ...porAnio,
        columnaVariacion(`${mesAnio(actual)} vs ${mesAnio(anterior)}`, 'variacion_periodo_anterior'),
        columnaCifra(`Acum ${mesAnio(anioAnterior)}`, 'acumulado_anio_anterior', {
          cellStyle: { 'text-align': 'right', 'border-left': '1px solid var(--mis-border)' },
        }),
        columnaCifra(`Acum ${mesAnio(actual)}`, 'acumulado_actual'),
        columnaVariacion(`${mesAnio(actual)} vs ${mesAnio(anioAnterior)}`, 'variacion_acumulado'),
        columnaVariacion(`${mesAnio(actual)} vs ${mesAnio(anioAnterior)} %`, 'variacion_acumulado_pct', 'percent'),
      ],
    },
  ];
}

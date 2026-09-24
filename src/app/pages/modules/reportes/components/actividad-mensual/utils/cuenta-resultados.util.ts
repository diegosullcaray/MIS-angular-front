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
 * Estilo por nivel de cuenta — `rowStyleFn` del legado, con tokens del Host. El
 * resultado (3) va en el fondo claro de marca en lugar del azul sólido para que
 * las flechas verde/rojo conserven contraste en ambos temas.
 */
export function estiloFilaCuenta(fila: Record<string, unknown>): Record<string, string> {
  switch (nivel(fila)) {
    case 3:
      return {
        background: 'var(--mis-primary-light)',
        color: 'var(--mis-primary-text)',
        'font-weight': '800',
        'border-top': '2px solid var(--mis-primary)',
      };
    case 2:
      return { background: 'var(--mis-hover-bg)', color: 'var(--mis-text-primary)', 'font-weight': '800' };
    default:
      return { background: 'var(--mis-surface)', color: 'var(--mis-text-secondary)', 'font-weight': '600' };
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
 * Color de la variación: en cuentas de gasto bajar es favorable; en el resto,
 * subir. El cero cuenta como favorable — `trafficColor()` del legado.
 */
export function colorVariacionCuenta(valor: number, fila: Record<string, unknown>): string {
  const esGasto = CUENTAS_GASTO_CUENTA_RESULTADOS.includes(String(fila['cuenta_codigo']));
  const favorable = esGasto ? valor <= 0 : valor >= 0;
  return favorable ? 'var(--mis-success)' : 'var(--mis-danger)';
}

/** 280px como el legado; en un teléfono se acota para que la columna fija no tape las cifras. */
const ESTILO_CUENTA_FIJA = {
  position: 'sticky',
  left: '0',
  'min-width': 'min(280px, 42vw)',
  width: 'min(280px, 42vw)',
  'white-space': 'normal',
};

function columnaCifra(label: string, key: string, extra: Partial<ColumnaDinamica> = {}): ColumnaDinamica {
  return {
    label,
    key,
    format: { type: 'integer' },
    cellStyle: { 'min-width': '92px', 'text-align': 'right' },
    cellStyleFn: (_valor, fila) => estiloFilaCuenta(fila),
    ...extra,
  };
}

function columnaVariacion(label: string, key: string, tipo: 'integer' | 'percent' = 'integer'): ColumnaDinamica {
  return columnaCifra(label, key, {
    format: { type: tipo },
    cellStyle: { 'min-width': '98px', 'text-align': 'right' },
    colorVariacion: colorVariacionCuenta,
  });
}

/** "Jun" — mes abreviado sin punto, como `toLocaleString('es-PE', { month: 'short' })` del legado. */
function mesCorto(fecha: Date): string {
  return capitalizar(fecha.toLocaleString('es-PE', { month: 'short' }).replace('.', ''));
}

function anioCorto(anio: number): string {
  return String(anio).slice(-2);
}

/**
 * Columnas relativas al periodo elegido — `createTableHeaders()` del legado:
 * mes del año anterior, mes anterior, mes actual y su variación; luego los
 * acumulados del año anterior y del actual con su variación absoluta y porcentual.
 */
export function crearColumnasCuentaResultados(fecha: string, preliminar: boolean): ColumnaDinamica[] {
  const actual = fechaLocal(fecha);
  const anterior = new Date(actual.getFullYear(), actual.getMonth() - 1, 1);
  const anio = actual.getFullYear();
  const mes = mesCorto(actual);
  const mesAnterior = mesCorto(anterior);
  const actualCorto = `${mes}-${anioCorto(anio)}`;
  const anteriorCorto = `${mesAnterior}-${anioCorto(anterior.getFullYear())}`;

  return [
    {
      label: 'Estado de ganancias y pérdidas',
      key: 'cuenta_nombre',
      style: { ...ESTILO_CUENTA_FIJA, 'z-index': '3' },
      cellStyle: { ...ESTILO_CUENTA_FIJA, 'z-index': '1', 'text-align': 'left' },
      cellStyleFn: (_valor, fila) => ({ ...estiloFilaCuenta(fila), 'padding-left': sangriaCuenta(fila) }),
    },
    {
      label: 'Mensual',
      key: 'mensual',
      subs: [
        columnaCifra(`${mes}-${anioCorto(anio - 1)}`, 'periodo_anio_anterior'),
        columnaCifra(`${mesAnterior}-${anioCorto(anio)}`, 'periodo_anterior'),
        columnaCifra(`${actualCorto}${preliminar ? ' · Prelim.' : ''}`, 'periodo_actual'),
        columnaVariacion(`${actualCorto} vs ${anteriorCorto}`, 'variacion_periodo_anterior'),
      ],
    },
    {
      label: 'Acumulado',
      key: 'acumulado',
      subs: [
        columnaCifra(`Acum. ${mes}-${anioCorto(anio - 1)}`, 'acumulado_anio_anterior', {
          cellStyle: { 'min-width': '98px', 'text-align': 'right', 'border-left': '1px solid var(--mis-border)' },
        }),
        columnaCifra(`Acum. ${actualCorto}`, 'acumulado_actual'),
        columnaVariacion('Var.', 'variacion_acumulado'),
        columnaVariacion('Var. %', 'variacion_acumulado_pct', 'percent'),
      ],
    },
  ];
}

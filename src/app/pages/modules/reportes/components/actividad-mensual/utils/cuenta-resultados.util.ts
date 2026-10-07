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

/** Payload que no cumple el contrato: su mensaje es el que ve la persona usuaria. */
export class ContratoCuentaResultadosError extends Error {}

/** `YYYY-MM-DD` de calendario válido, o `null`. */
export function normalizarFechaCuenta(valor: unknown): string | null {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const valida = fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  return valida ? valor : null;
}

/** `YYYYMMDD`, el formato del parámetro `fecha`. */
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

/** "Junio de 2026" */
export function etiquetaPeriodoCuenta(valor: string): string {
  return capitalizar(fechaLocal(valor).toLocaleString('es-PE', { month: 'long', year: 'numeric' }));
}

/** Metadatos de `resultado.headers`, o `null` si no cumplen el contrato. */
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

/** Si la fecha pedida no figura entre los periodos (p. ej. `NOW`), las cifras son del primero. Lanza `ContratoCuentaResultadosError` ante un payload inválido. */
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
    filas: resultado.data as CuentaResultadoFila[],
  };
}

function nivel(fila: Record<string, unknown>): number {
  return Number(fila['style']);
}

/** Estilo por nivel (tipo Numbers): resultado (3) con tinte de marca y filete superior, cuenta principal (2) en el fondo de marca, detalle en la superficie. Todas con filete fino y cifras tabulares. */
export function estiloFilaCuenta(fila: Record<string, unknown>): Record<string, string> {
  const base = {
    'border-bottom': '1px solid color-mix(in srgb, var(--mis-border) 55%, transparent)',
    'font-variant-numeric': 'tabular-nums',
  };
  switch (nivel(fila)) {
    // Totales (márgenes): sin relleno, texto principal y filete de marca arriba y abajo; así no se confunden con las cuentas desplegables (2), que van tintadas.
    case 3:
      return {
        ...base,
        background: 'var(--mis-surface)',
        color: 'var(--mis-text-primary)',
        'font-weight': '800',
        'border-top': '2px solid var(--mis-primary)',
        'border-bottom': '1px solid var(--mis-primary)',
      };
    case 2:
      return { ...base, background: 'var(--mis-primary-light)', color: 'var(--mis-primary-text)', 'font-weight': '700' };
    default:
      return { ...base, background: 'var(--mis-surface)', color: 'var(--mis-text-secondary)', 'font-weight': '500' };
  }
}

/** 2 y 3 (principal y resultado) son raíz; 1, 4 y 5 bajan en ese orden. */
function profundidad(fila: Record<string, unknown>): number {
  return { 2: 0, 3: 0, 1: 1, 4: 2, 5: 3 }[nivel(fila)] ?? 0;
}

/** Códigos de las cuentas que tienen detalle debajo (la fila siguiente es más profunda). */
export function cuentasConDetalle(filas: readonly Record<string, unknown>[]): Set<string> {
  const con = new Set<string>();
  filas.forEach((fila, i) => {
    const siguiente = filas[i + 1];
    if (siguiente && profundidad(siguiente) > profundidad(fila)) con.add(String(fila['cuenta_codigo']));
  });
  return con;
}

/** Filas del drill down: cada cuenta abierta (por código) muestra su detalle; el cuadro +/− lo pinta la tabla (`desplegada`). */
export function filasConDrillDown<T extends Record<string, unknown>>(filas: readonly T[], abiertas: ReadonlySet<string>): T[] {
  const visibles: T[] = [];
  const ruta: boolean[] = []; // ruta[d]: el ancestro a profundidad d está abierto
  for (const fila of filas) {
    const d = profundidad(fila);
    ruta.length = d;
    ruta[d] = abiertas.has(String(fila['cuenta_codigo']));
    if (ruta.slice(0, d).some((a) => !a)) continue;
    visibles.push(fila);
  }
  return visibles;
}

/** Sangría de la cuenta según su nivel. */
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

/** Color del punto de variación: en cuentas de gasto bajar es favorable; en el resto, subir. El cero es favorable. */
export function colorVariacionCuenta(valor: number, fila: Record<string, unknown>): string {
  const esGasto = CUENTAS_GASTO_CUENTA_RESULTADOS.includes(String(fila['cuenta_codigo']));
  const favorable = esGasto ? valor <= 0 : valor >= 0;
  return favorable ? 'var(--mis-success)' : 'var(--mis-danger)';
}

/** La columna fija tapa las cifras al desplazar: su fondo se apila sobre la superficie sólida. */
export function fondoOpaco(fondo: string | undefined): string {
  return fondo ? `linear-gradient(${fondo}, ${fondo}), var(--mis-surface)` : 'var(--mis-surface)';
}

/** Columna fija de cuentas; en un teléfono se acota. */
const ESTILO_CUENTA_FIJA = {
  position: 'sticky',
  left: '0',
  'min-width': 'min(290px, 40vw)',
  width: 'min(290px, 40vw)',
  'white-space': 'normal',
};

/** Encabezado tipo macOS (Numbers/Finder): claro, texto secundario sin mayúsculas y filetes finos, en vez de la banda de marca sólida. */
const ENCABEZADO_MAC = {
  background: 'var(--mis-surface)',
  color: 'var(--mis-text-secondary)',
  'font-weight': '600',
  'text-transform': 'none',
  'border-color': 'color-mix(in srgb, var(--mis-border) 60%, transparent)',
};

/** Encabezado de una cifra: compacto y a la derecha. */
const ENCABEZADO_CIFRA = { ...ENCABEZADO_MAC, 'text-align': 'right', padding: '4px 8px' };

/** "Preliminar Ago": el mes aún abierto va en mostaza con texto negro. */
const ENCABEZADO_PRELIMINAR = {
  ...ENCABEZADO_CIFRA,
  background: 'color-mix(in srgb, var(--mis-escala-3) 30%, var(--mis-surface))',
  color: 'var(--mis-text-primary)',
};

/** Ancho fijo de cada cifra: si no entran, la tabla se desplaza en horizontal. */
const CELDA_CIFRA = { 'text-align': 'right', 'min-width': '84px' };

function columnaCifra(label: string, key: string, extra: Partial<ColumnaDinamica> = {}): ColumnaDinamica {
  return {
    label,
    key,
    format: { type: 'integer' },
    style: ENCABEZADO_CIFRA,
    cellStyle: CELDA_CIFRA,
    cellStyleFn: (_valor, fila) => estiloFilaCuenta(fila),
    ...extra,
  };
}

/** Cifra con punto de semáforo; `desde` es la variación que decide el color. */
function conSemaforo(columna: ColumnaDinamica, desde = columna.key): ColumnaDinamica {
  return {
    ...columna,
    colorVariacion: (_valor, fila) => {
      const variacion = fila[desde];
      // Sin la variación que decide el color, no hay semáforo (no se pinta rojo por omisión).
      if (variacion == null || variacion === '' || !Number.isFinite(Number(variacion))) return null;
      return colorVariacionCuenta(Number(variacion), fila);
    },
    indicadorVariacion: 'punto',
  };
}

/** "Ago" */
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

/** Filete que separa el bloque del mes del acumulado. */
const SEPARADOR_BLOQUE = { 'border-left': '2px solid var(--mis-border-strong)' };

/**
 * Dos bloques con el mismo patrón (valores y luego variación): el mes (mismo mes del año
 * anterior, mes anterior, mes actual y su variación) y el acumulado del año (año anterior,
 * actual, variación y %). El nivel ya se lee en la línea de contexto sobre la tabla.
 */
export function crearColumnasCuentaResultados(fecha: string, preliminar: boolean): ColumnaDinamica[] {
  const actual = fechaLocal(fecha);
  const anterior = new Date(actual.getFullYear(), actual.getMonth() - 1, 1);
  const anioAnterior = new Date(actual.getFullYear() - 1, actual.getMonth(), 1);
  const mes = mesCorto(actual);

  return [
    {
      label: 'Estado de ganancias y pérdidas · en miles (PEN)',
      key: 'cuenta_nombre',
      style: { ...ENCABEZADO_MAC, ...ESTILO_CUENTA_FIJA, 'z-index': '3', 'text-align': 'left' },
      cellStyle: { ...ESTILO_CUENTA_FIJA, 'z-index': '1', 'text-align': 'left' },
      cellStyleFn: (_valor, fila) => {
        const estilo = estiloFilaCuenta(fila);
        return { ...estilo, background: fondoOpaco(estilo['background']), 'padding-left': sangriaCuenta(fila) };
      },
    },
    {
      label: 'Flujo mensual',
      key: 'bloque_mes',
      style: { ...ENCABEZADO_MAC, color: 'var(--mis-text-primary)' },
      subs: [
        columnaCifra(mesAnio(anioAnterior), 'periodo_anio_anterior'),
        columnaCifra(mesAnio(anterior), 'periodo_anterior'),
        preliminar
          ? columnaCifra(`Preliminar ${mesAnio(actual)}`, 'periodo_actual', { style: ENCABEZADO_PRELIMINAR })
          : columnaCifra(mesAnio(actual), 'periodo_actual'),
        conSemaforo(columnaCifra(`${mesAnio(actual)} vs ${mesAnio(anterior)}`, 'variacion_periodo_anterior')),
      ],
    },
    {
      label: actual.getMonth() === 0 ? 'Acumulado Ene' : `Acumulado Ene–${mes}`,
      key: 'bloque_acumulado',
      style: { ...ENCABEZADO_MAC, ...SEPARADOR_BLOQUE, color: 'var(--mis-text-primary)' },
      subs: [
        columnaCifra(String(anioAnterior.getFullYear()), 'acumulado_anio_anterior', {
          style: { ...ENCABEZADO_CIFRA, ...SEPARADOR_BLOQUE },
          cellStyle: { ...CELDA_CIFRA, ...SEPARADOR_BLOQUE },
        }),
        // El acumulado del año se juzga por su variación contra el año anterior.
        conSemaforo(columnaCifra(String(actual.getFullYear()), 'acumulado_actual'), 'variacion_acumulado'),
        conSemaforo(columnaCifra(`${mesAnio(actual)} vs ${mesAnio(anioAnterior)}`, 'variacion_acumulado')),
        columnaCifra(`${mesAnio(actual)} vs ${mesAnio(anioAnterior)} %`, 'variacion_acumulado_pct', { format: { type: 'percent' } }),
      ],
    },
  ];
}

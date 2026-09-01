import { ESCALA_ESTRUCTURA_DESEMBOLSOS, ID_RANGO_DISTRIBUCION } from '../constantes/actividad-mensual.constantes';
import type { ColumnaDinamica, TablaDinamicaResultado } from '../../../models/tabla-dinamica.model';

/**
 * Coloración condicional de Estructura de Desembolsos.
 *
 * Solo se pinta la fila de distribución porcentual, y dentro de ella cada celda
 * toma su color por el puesto que ocupa su valor dentro de su grupo de columnas
 * (`_Ope` o `_MON`), de menor a mayor. Los grupos se detectan de las cabeceras
 * porque la versión diaria trae tres columnas y la mensual, cinco.
 */
export function aplicarEstilosEstructuraDesembolsos(tabla: TablaDinamicaResultado): TablaDinamicaResultado {
  if (!tabla?.columnas) return tabla;

  const claves = aplanar(tabla.columnas)
    .map((c) => c.key)
    .filter((k): k is string => Boolean(k));
  const grupoOpe = claves.filter((k) => /^\d+_ope$/i.test(k)).sort();
  const grupoMon = claves.filter((k) => /^\d+_mon$/i.test(k)).sort();

  return { ...tabla, columnas: conEstilos(tabla.columnas, grupoOpe, grupoMon), filas: tabla.filas ?? [] };
}

function aplanar(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
  return columnas.flatMap((c) => [c, ...(c.subs ? aplanar(c.subs) : [])]);
}

function conEstilos(columnas: ColumnaDinamica[], grupoOpe: string[], grupoMon: string[]): ColumnaDinamica[] {
  return columnas.map((col) => {
    const nueva = { ...col };
    const clave = col.key?.toLowerCase() ?? '';
    const grupo = grupoOpe.some((k) => k.toLowerCase() === clave)
      ? grupoOpe
      : grupoMon.some((k) => k.toLowerCase() === clave)
        ? grupoMon
        : undefined;

    if (grupo && col.key) {
      nueva.cellStyleFn = (_v, fila) => estiloCelda(fila, col.key, grupo);
    }
    if (nueva.subs?.length) nueva.subs = conEstilos(nueva.subs, grupoOpe, grupoMon);
    return nueva;
  });
}

function estiloCelda(
  fila: Record<string, unknown>,
  clave: string,
  grupo: string[],
): Record<string, string> | undefined {
  if (!fila || !clave || !esFilaDistribucion(fila)) return undefined;

  const ordenadas = grupo
    .map((k) => ({ k, valor: aNumero(fila[k]) }))
    .sort((a, b) => a.valor - b.valor);
  const puesto = ordenadas.findIndex((x) => x.k.toLowerCase() === clave.toLowerCase());
  if (puesto === -1) return undefined;

  // Con tres columnas se saltean los intermedios para que la escala llegue igual
  // de verde a rojo en vez de quedarse en el tramo bajo.
  const escala =
    grupo.length === 3
      ? [ESCALA_ESTRUCTURA_DESEMBOLSOS[0], ESCALA_ESTRUCTURA_DESEMBOLSOS[2], ESCALA_ESTRUCTURA_DESEMBOLSOS[4]]
      : ESCALA_ESTRUCTURA_DESEMBOLSOS;
  const color = escala[puesto] ?? escala[0];

  return {
    'background-color': color.bg,
    color: color.text,
    'font-weight': 'bold',
    'text-align': 'center',
    'border-radius': '4px',
  };
}

/** El nombre de la columna de rango cambia entre versiones del reporte. */
function esFilaDistribucion(fila: Record<string, unknown>): boolean {
  const idRango = Number(fila['IDRango'] ?? fila['idrango'] ?? fila['ID_RANGO']);
  const descripcion = String(fila['DES_RANGO'] ?? fila['des_rango'] ?? fila['RangoDesembolso'] ?? '').toLowerCase();
  return idRango === ID_RANGO_DISTRIBUCION || descripcion.includes('%') || descripcion.includes('part');
}

function aNumero(valor: unknown): number {
  if (valor == null) return 0;
  const limpio = String(valor).replace(/[%,]/g, '').trim();
  const numero = parseFloat(limpio);
  return Number.isNaN(numero) ? 0 : numero;
}

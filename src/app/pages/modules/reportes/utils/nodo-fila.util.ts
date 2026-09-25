import type { HierarquiaNodo } from '../models/jerarquia.model';

/**
 * Nodo de jerarquía que representa una fila de tabla, para el drill down (clic en la fila → bajar
 * a ese nivel). El motor `table.regular` lo manda con dos nombres según el reporte:
 * `htipcod` + `cod_rel` (p. ej. Cartera Agrícola) o `htipcod` + `hcodrel` (p. ej. Dashboard Revisión).
 * `claveEtiqueta` es la columna con el nombre de la fila (para las migas); sin ella se prueba con las
 * habituales. Devuelve `null` si la fila no trae un nodo completo, como la fila de totales.
 */
export function nodoDeFila(fila: Record<string, unknown>, claveEtiqueta?: string): HierarquiaNodo | null {
  const tipCod = Number(fila['htipcod'] ?? fila['tip_cod']);
  const codRel = fila['cod_rel'] ?? fila['hcodrel'];
  if (!Number.isFinite(tipCod) || codRel === null || codRel === undefined || codRel === '') return null;

  return {
    tip_cod: tipCod,
    cod_rel: String(codRel),
    des_rel: String((claveEtiqueta ? fila[claveEtiqueta] : undefined) ?? fila['descripcion'] ?? fila['rdesjer'] ?? fila['DESCRIPCION'] ?? ''),
  };
}

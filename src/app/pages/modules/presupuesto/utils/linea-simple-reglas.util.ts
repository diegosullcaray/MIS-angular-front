import type { FilaLineaSimple, HierarquiaNodo, ResumenMetadata } from '../models';

/** `actSave` del legado — habilita Guardar/Reiniciar: nivel activo = nivel editable Y (responsable vigente o admin). */
export function calcularPuedeGuardar(
  metadata: ResumenMetadata | null,
  nivel: HierarquiaNodo | null,
  esAdmin: boolean
): boolean {
  if (!metadata || !nivel) return false;
  const adm = metadata.act_res || esAdmin;
  return nivel.tip_cod === metadata.tip_cod_edi && adm;
}

/** `actVeri` del legado — habilita Verificar: admin/responsable, pero en un nivel distinto al editable. */
export function calcularPuedeVerificar(
  metadata: ResumenMetadata | null,
  nivel: HierarquiaNodo | null,
  esAdmin: boolean
): boolean {
  if (!metadata || !nivel) return false;
  const adm = metadata.act_res || esAdmin;
  return !calcularPuedeGuardar(metadata, nivel, esAdmin) && adm;
}

/**
 * `customComponent()` del legado — decide si una celda es editable. `inputCols[0]`/`inputCols[3]`
 * (si existen) tienen una ventana de edición corta especial (`ord_ini_edi`..`ord_ini_edi_ASESPROD`,
 * solo usada por Cartera Créditos para "Asesores Nuevos"/"Asesores en Producción"); el resto de
 * columnas de `inputCols` son editables desde `ord_ini_edi` en adelante sin techo.
 */
export function esCeldaEditable(
  fila: FilaLineaSimple,
  key: string,
  inputCols: string[] | 'all',
  metadata: ResumenMetadata | null,
  nivel: HierarquiaNodo | null,
  esAdmin: boolean
): boolean {
  if (!metadata || !nivel) return false;

  const enColumnasEntrada = inputCols === 'all' ? true : inputCols.includes(key);
  const adm = metadata.act_res || esAdmin;
  const nivelActivo = nivel.tip_cod === metadata.tip_cod_edi;
  const ord = fila.ord;

  const col0 = inputCols === 'all' ? undefined : inputCols[0];
  const col3 = inputCols === 'all' ? undefined : inputCols[3];
  const dentroVentanaCorta =
    metadata.ord_ini_edi_ASESPROD !== undefined && ord >= metadata.ord_ini_edi && ord <= metadata.ord_ini_edi_ASESPROD;

  if (enColumnasEntrada && adm && nivelActivo && key === col3 && dentroVentanaCorta) return true;
  if (enColumnasEntrada && adm && nivelActivo && key === col0 && dentroVentanaCorta) return false;
  if (enColumnasEntrada && adm && ord >= metadata.ord_ini_edi && nivelActivo && key !== col3) return true;
  return false;
}

/** Helpers puros de transformación de datos — migrados de los métodos privados `resetCfg`/`updateCfg`/`updateCfg2`/`sumFromIds`/`round` de `incentivos3.service.ts` (legado STG). */

/** Marca `show=true` en los ítems cuyo `id` está en `idsVisibles` (y `false` en el resto) — `updateCfg(arr, ids, 'show')` del legado. */
export function marcarVisibles<T extends { id: string; show: boolean }>(items: T[], idsVisibles: string[]): T[] {
  const set = new Set(idsVisibles);
  return items.map((item) => ({ ...item, show: set.has(item.id) }));
}

/** Marca `enab=true` en los ítems cuyo `id` está en `idsHabilitados` (y `false` en el resto) — `updateCfg(arr, ids, 'enab')` del legado. */
export function marcarHabilitados<T extends { id: string; enab: boolean }>(items: T[], idsHabilitados: string[]): T[] {
  const set = new Set(idsHabilitados);
  return items.map((item) => ({ ...item, enab: set.has(item.id) }));
}

/** Copia el valor de `origen[\`${prefijo}${item.id}${sufijo}\`]` al campo `campo` de cada ítem cuyo `id` arme una clave presente en `origen` — `updateCfg2()` del legado. */
export function asignarValores<T extends { id: string }>(
  items: T[],
  origen: Record<string, unknown>,
  campo: keyof T,
  prefijo: string,
  sufijo: string
): T[] {
  return items.map((item) => {
    const clave = `${prefijo}${item.id}${sufijo}`;
    return clave in origen ? { ...item, [campo]: origen[clave] } : item;
  });
}

/** Suma `origen[\`${prefijo}${id}${sufijo}\`]` para cada `id` en `ids`, ignorando claves ausentes o no numéricas — `sumFromIds()` del legado. */
export function sumarPorIds(origen: Record<string, unknown>, ids: string[], prefijo: string, sufijo: string): number {
  return ids.reduce((total, id) => {
    const clave = `${prefijo}${id}${sufijo}`;
    const valor = Number(origen[clave]);
    return Number.isNaN(valor) ? total : total + valor;
  }, 0);
}

/** Redondeo a N decimales — `round()` del legado (`app/core/helpers/functions.util.ts`). */
export function redondear(valor: number, decimales = 0): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

/** Situación de comisión a partir de `ds4.flag_act` — bloque `if/else if` de `setDs()` en el legado. */
export function resolverSituacion(flagAct: number): { codigo: number; descripcion: string } {
  if (flagAct === 1) return { codigo: 1, descripcion: '(Activado)' };
  if (flagAct === -1) return { codigo: 0, descripcion: '(No Aplica)' };
  return { codigo: 0, descripcion: '(Desactivado)' };
}

/**
 * Regla de semáforo compartida por los reportes: el backend manda, junto a cada
 * indicador, un campo `style_<campo>` con `1` (verde/cumple), `0` (ámbar/alerta)
 * o `-1` (rojo/riesgo). Es la misma convención que ya usa `TablaReporteComponent`
 * para colorear celdas (`style_<columnDef>`) y el panel del asesor para sus
 * tarjetas KPI (`style_cumpl_des_acum`, `style_cumpl_ope_acum`).
 */
export function semaforo(valor: unknown): 1 | 0 | -1 | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return n === 1 || n === 0 || n === -1 ? n : null;
}

/** Severidad de PrimeNG (`p-tag`, `p-message`, etc.) que corresponde a un valor de semáforo. */
export function severidadSemaforo(valor: unknown): 'success' | 'warn' | 'danger' | 'info' {
  const s = semaforo(valor);
  if (s === 1) return 'success';
  if (s === 0) return 'warn';
  if (s === -1) return 'danger';
  return 'info';
}

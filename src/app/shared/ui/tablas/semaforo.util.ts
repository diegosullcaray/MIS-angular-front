/** Color de texto para un valor de semáforo del backend: 1 = éxito, 0 = alerta, -1 = peligro. */
export function colorSemaforo(valor: unknown): string {
  // `Number(null)` y `Number('')` valen 0: sin este corte, una celda sin valor salía como "alerta".
  if (valor === null || valor === undefined || valor === '') return 'text-[var(--mis-text-tertiary)]';
  const num = Number(valor);
  if (num === 1) return 'text-[var(--mis-success)]';
  if (num === 0) return 'text-orange-500';
  if (num === -1) return 'text-[var(--mis-danger)]';
  return 'text-[var(--mis-text-tertiary)]';
}

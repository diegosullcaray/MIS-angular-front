/** Color de texto para un valor de semáforo del backend: 1 = éxito, 0 = alerta, -1 = peligro. */
export function colorSemaforo(valor: unknown): string {
  const num = Number(valor);
  if (num === 1) return 'text-[var(--mis-success)]';
  if (num === 0) return 'text-orange-500';
  if (num === -1) return 'text-[var(--mis-danger)]';
  return 'text-[var(--mis-text-tertiary)]';
}

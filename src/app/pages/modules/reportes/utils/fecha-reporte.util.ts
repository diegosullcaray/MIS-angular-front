/** Retorna la fecha local en formato YYYY-MM-DD. */
function fechaLocal(fecha: Date): string {
  const parte = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${parte(fecha.getMonth() + 1)}-${parte(fecha.getDate())}`;
}

/** Retorna la fecha del último día completado (ayer). */
export function fechaUltimoDia(): string {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return fechaLocal(ayer).replace(/-/g, '');
}

/** Retorna la fecha de corte compacta en YYYYMMDD. */
export function fechaCorteCompacta(fechaCorteUsuario: string | undefined): string {
  if (fechaCorteUsuario && /^\d{8}$/.test(fechaCorteUsuario)) return fechaCorteUsuario;
  return fechaUltimoDia();
}

/**
 * Retorna la fecha de corte en formato YYYY-MM-DD.
 * @param fechaCorteUsuario Fecha de corte de usuario en formato compacto.
 */
export function fechaCorte(fechaCorteUsuario: string | undefined): string {
  const compacta = fechaCorteCompacta(fechaCorteUsuario);
  return `${compacta.slice(0, 4)}-${compacta.slice(4, 6)}-${compacta.slice(6, 8)}`;
}

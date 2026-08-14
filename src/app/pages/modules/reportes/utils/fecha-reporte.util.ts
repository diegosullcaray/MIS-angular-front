/** Fecha del último día completado (`YYYYMMDD`) — `fec_day_ult` del legado (`Moments().add(-1,'days')`), usada por los parámetros propios de varios reportes (ej. `RS_MON_REP`, `DESEMP_SOC`). */
export function fechaUltimoDia(): string {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return ayer.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Fecha de corte (`YYYY-MM-DD`) con la que se pide cada nivel de la jerarquía
 * y algunos reportes (ej. Productos/Población Misionales). Distinta de
 * `fechaUltimoDia()` (`YYYYMMDD`, un día antes).
 *
 * @param fechaCorteUsuario `usuarioActivo()?.fechaCorte` (`YYYYMMDD`) — el
 *   fallback a la fecha real puede pedir un día que el backend no cerró
 *   todavía y devolver la jerarquía vacía; solo aplica si el Host aún no
 *   expuso `fechaCorte`.
 */
export function fechaCorte(fechaCorteUsuario: string | undefined): string {
  if (fechaCorteUsuario && /^\d{8}$/.test(fechaCorteUsuario)) {
    return `${fechaCorteUsuario.slice(0, 4)}-${fechaCorteUsuario.slice(4, 6)}-${fechaCorteUsuario.slice(6, 8)}`;
  }
  return new Date().toISOString().slice(0, 10);
}

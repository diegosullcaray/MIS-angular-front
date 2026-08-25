/** Fecha local en formato `YYYY-MM-DD`, a partir de los componentes de calendario locales (`getFullYear`/`getMonth`/`getDate`) — nunca `toISOString()`, que convierte a UTC: en Perú (UTC-5), desde ~19:00 hora local en adelante, sumar esas 5 horas para llegar a UTC "cruza" al día siguiente y termina devolviendo la fecha de mañana en vez de la de hoy. */
function fechaLocal(fecha: Date): string {
  const parte = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${parte(fecha.getMonth() + 1)}-${parte(fecha.getDate())}`;
}

/** Fecha del último día completado (`YYYYMMDD`) — `fec_day_ult` del legado (`Moments().add(-1,'days')`), usada por los parámetros propios de varios reportes (ej. `RS_MON_REP`, `DESEMP_SOC`). */
export function fechaUltimoDia(): string {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return fechaLocal(ayer).replace(/-/g, '');
}

/**
 * Fecha de corte del backend en `YYYYMMDD` — el formato que espera el parámetro
 * `fec` de los reportes del motor "mixto" (`fec_day_ult` del legado).
 *
 * El legado calculaba ese `fec` como "ayer" según el reloj del cliente. Eso solo
 * acierta si el backend ya cerró el día anterior: cuando su corte real va más
 * atrás, el reporte pide un día sin datos y la tabla vuelve vacía. `curr_fec`
 * (`usuarioActivo().fechaCorte`) es la fecha que el backend declara como
 * cerrada, así que se prefiere; si todavía no llegó, se cae a "ayer".
 */
export function fechaCorteCompacta(fechaCorteUsuario: string | undefined): string {
  if (fechaCorteUsuario && /^\d{8}$/.test(fechaCorteUsuario)) return fechaCorteUsuario;
  return fechaUltimoDia();
}

/**
 * Fecha de corte (`YYYY-MM-DD`) con la que se pide cada nivel de la jerarquía
 * y algunos reportes (ej. Productos/Población Misionales). Mismo día que
 * `fechaCorteCompacta()`, solo que con guiones.
 *
 * El fallback es "ayer", igual que su hermana: el legado nunca pide HOY para
 * la jerarquía (`getHierarchyConfig('UNI_1')` usa `moment(profile.curr_fec)`,
 * la fecha que el backend declara cerrada). Pedir el día en curso devuelve
 * `level_hierarchy` vacío y el selector muestra "No se pudo cargar la
 * jerarquía".
 *
 * @param fechaCorteUsuario `usuarioActivo()?.fechaCorte` (`YYYYMMDD`).
 */
export function fechaCorte(fechaCorteUsuario: string | undefined): string {
  const compacta = fechaCorteCompacta(fechaCorteUsuario);
  return `${compacta.slice(0, 4)}-${compacta.slice(4, 6)}-${compacta.slice(6, 8)}`;
}

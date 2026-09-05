/**
 * Fecha de corte (`YYYY-MM-DD`) con la que se pide cada nivel de la jerarquía.
 *
 * El legado nunca pide HOY: `getHierarchyConfig('UNI_1')` usa `moment(profile.curr_fec)`, la
 * fecha que el backend declara cerrada. Pedir el día en curso devuelve `level_hierarchy` vacío y
 * el selector queda en "No se pudo cargar la jerarquía" — de ahí que el fallback sea AYER y no hoy.
 *
 * @param fechaCorteUsuario `usuarioActivo()?.fechaCorte`, en `YYYYMMDD` o `YYYY-MM-DD`.
 */
export function fechaCorteJerarquia(fechaCorteUsuario: string | undefined): string {
  if (fechaCorteUsuario && /^\d{8}$/.test(fechaCorteUsuario)) {
    return `${fechaCorteUsuario.slice(0, 4)}-${fechaCorteUsuario.slice(4, 6)}-${fechaCorteUsuario.slice(6, 8)}`;
  }
  if (fechaCorteUsuario && /^\d{4}-\d{2}-\d{2}$/.test(fechaCorteUsuario)) {
    return fechaCorteUsuario;
  }
  return fechaLocalDeAyer();
}

/**
 * Ayer en `YYYY-MM-DD`, con los componentes de calendario **locales** — nunca `toISOString()`,
 * que convierte a UTC: en Perú (UTC-5), de ~19:00 en adelante, sumar esas 5 horas cruza al día
 * siguiente y devuelve la fecha de mañana.
 */
function fechaLocalDeAyer(): string {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const parte = (n: number) => String(n).padStart(2, '0');
  return `${ayer.getFullYear()}-${parte(ayer.getMonth() + 1)}-${parte(ayer.getDate())}`;
}

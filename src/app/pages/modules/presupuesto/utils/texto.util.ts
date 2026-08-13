/** Quita tildes/diacriticos para comparar texto sin distinguir acentos. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Filtra filas por `des_rel` sin distinguir acentos, usado por Responsables y Tablero de Verificacion. */
export function filtrarPorDescripcion<T extends { des_rel: string }>(filas: T[], filtro: string): T[] {
  const termino = normalizarTexto(filtro.trim());
  if (!termino) return filas;
  return filas.filter((f) => normalizarTexto(f.des_rel).includes(termino));
}

/** Opción de un desplegable de filtro — misma forma que `filter-locale.module.ts` del legado (`{ id, desc }`). */
export interface OpcionFiltro<T extends string | number = string> {
  id: T;
  desc: string;
}

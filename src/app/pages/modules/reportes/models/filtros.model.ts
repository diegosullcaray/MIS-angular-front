/** Opción de un desplegable de filtro — misma forma que `filter-locale.module.ts` del legado (`{ id, desc }`). */
export interface OpcionFiltro<T extends string | number = string> {
  id: T;
  desc: string;
}

/** `Tipo01()` del legado — variable `agr` de "Gestión de Tasas Pasivas". */
export const OPCIONES_TIPO_TRAMO_PLAZO: OpcionFiltro<number>[] = [
  { id: 1, desc: 'TRAMO' },
  { id: 2, desc: 'PLAZO' },
];
export const TIPO_TRAMO_PLAZO_POR_DEFECTO = 1;

/** `Canal01()` del legado — variable `var` de "Gestión de Tasas Pasivas". */
export const OPCIONES_CANAL: OpcionFiltro<number>[] = [
  { id: 101, desc: 'RED DE AGENCIAS' },
  { id: 102, desc: 'BANCA PREFERENTE' },
];
export const CANAL_POR_DEFECTO = 101;

/** `SPRODUCTO()` del legado — base de `OPCIONES_PRODUCTO_PASIVO_AMPLIADO`. */
export const OPCIONES_PRODUCTO_PASIVO: OpcionFiltro[] = [
  { id: 'TODOS', desc: 'TODOS' },
  { id: 'AHORROS', desc: 'AHORROS' },
  { id: 'CTS', desc: 'CTS' },
  { id: 'PLAZO FIJO', desc: 'DPF' },
];

/** `SPRODUCTO_()` del legado — igual que `SPRODUCTO()` más la combinación, usada por "Panel Operaciones". */
export const OPCIONES_PRODUCTO_PASIVO_AMPLIADO: OpcionFiltro[] = [
  ...OPCIONES_PRODUCTO_PASIVO,
  { id: 'AHORRO+PLAZO FIJO', desc: 'AHORRO+PLAZO FIJO' },
];

/** Valor "sin filtrar" de `SPRODUCTO*()`. */
export const TODOS = 'TODOS';

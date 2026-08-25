import type { OpcionFiltro } from '../../../../shared/ui/formularios/opcion-filtro.model';

// El tipo vive en `shared/ui/formularios` junto a `<app-select-filtro>`, que es quien lo pinta;
// acá quedan los catálogos de negocio de Reportes, que no tienen por qué estar en shared.
export type { OpcionFiltro };

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

/** `varProducto()` del legado — variante con otra capitalización de ids, usada por "Seguimiento Captaciones Banca Preferente". */
export const OPCIONES_PRODUCTO_BP: OpcionFiltro[] = [
  { id: 'TODOS', desc: 'Todos' },
  { id: 'Ahorros', desc: 'Ahorros' },
  { id: 'Plazo Fijo', desc: 'Plazo Fijo' },
  { id: 'Cts', desc: 'Cts' },
];

/** `Segmento()` del legado — variable `segmento` de "Captación por Canal Operaciones". */
export const OPCIONES_SEGMENTO: OpcionFiltro[] = [
  { id: 'TODOS', desc: 'Todos' },
  { id: 'Mujer', desc: 'Mujer' },
  { id: 'Rural', desc: 'Rural' },
  { id: 'Urbano', desc: 'Urbano' },
  { id: 'Migrantes', desc: 'Migrantes' },
];

/** `TipoVariable()` del legado — variable `agru` de los reportes "CMG Clientes Pasivo". */
export const OPCIONES_VARIABLE_CMG: OpcionFiltro[] = [
  { id: 'Clientes', desc: 'Clientes' },
  { id: 'Cuentas', desc: 'Cuentas' },
  { id: 'Saldo', desc: 'Saldo' },
];
export const VARIABLE_CMG_POR_DEFECTO = 'Clientes';

/** `TipoGrupo()` del legado — variable `grupo` de "CMG Clientes Pasivo Detalle". */
export const OPCIONES_GRUPO_CMG: OpcionFiltro[] = [
  { id: 'Nuevo', desc: 'Nuevos del Mes' },
  { id: 'Anual', desc: 'Nuevos Año' },
];
export const GRUPO_CMG_POR_DEFECTO = 'Nuevo';

/** Valor "sin filtrar" de `SPRODUCTO*()`. */
export const TODOS = 'TODOS';

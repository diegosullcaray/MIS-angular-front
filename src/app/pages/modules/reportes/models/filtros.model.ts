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

/** Valor "sin filtrar" de `SPRODUCTO*()`. */
export const TODOS = 'TODOS';
/** Valor sin filtro de los reportes de efectividades y detalle reasignado. */
export const TODO = 'TODO';

export const OPCIONES_PRECOSECHA: OpcionFiltro[] = [
  { id: TODO, desc: TODO },
  { id: '3', desc: '3 Meses' },
  { id: '6', desc: '6 Meses' },
];

/* Filtros de efectividades del legado: los usan el monitor del asesor y el portafolio reasignado. */
/** `Tramo01()` del legado — variable `tramof`. */
export const OPCIONES_TRAMO: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: '0. -30', desc: '0. -30' },
  { id: '1. -30-0', desc: '1. -30-0' },
  { id: '2. 1-30', desc: '2. 1-30' },
  { id: '3. 31-60', desc: '3. 31-60' },
  { id: '4. 61-90', desc: '4. 61-90' },
  { id: '5. 91-120', desc: '5. 91-120' },
  { id: '6. 121-150', desc: '6. 121-150' },
  { id: '7. 151-180', desc: '7. 151-180' },
  { id: '8. >180', desc: '8. >180' },
  { id: '9. Judicial', desc: '9. Judicial' },
];

/** `Producto01()` del legado — variable `prod`. */
export const OPCIONES_PRODUCTO_EFECTIVIDADES: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: 'AGROPECUARIO', desc: 'AGROPECUARIO' },
  { id: 'CONSTRUYENDO CONFIANZA', desc: 'CONSTRUYENDO CONFIANZA' },
  { id: 'CONSUMO', desc: 'CONSUMO' },
  { id: 'CREDITO EDUCATIVO', desc: 'CREDITO EDUCATIVO' },
  { id: 'CREDITOS FAE', desc: 'CREDITOS FAE' },
  { id: 'CREDITOS REACTIVA', desc: 'CREDITOS REACTIVA' },
  { id: 'EMPRENDIENDO CONFIANZA', desc: 'EMPRENDIENDO CONFIANZA' },
  { id: 'GARANTIA LIQUIDA', desc: 'GARANTIA LIQUIDA' },
  { id: 'HIPOTECARIO', desc: 'HIPOTECARIO' },
  { id: 'INCLUSION FAE MUJER', desc: 'INCLUSION FAE MUJER' },
  { id: 'INICIANDO CONFIANZA', desc: 'INICIANDO CONFIANZA' },
  { id: 'TRABAJADORES FC', desc: 'TRABAJADORES FC' },
  { id: 'INICIANDO CONFIANZA PYME', desc: 'INICIANDO CONFIANZA PYME' },
  { id: 'INICIANDO NEGOCIOS', desc: 'INICIANDO NEGOCIOS' },
  { id: 'INICIANDO OFICIOS', desc: 'INICIANDO OFICIOS' },
  { id: 'MAXIGAS', desc: 'MAXIGAS' },
  { id: 'NEGOCIOS FAE MUJER', desc: 'NEGOCIOS FAE MUJER' },
  { id: 'PALABRA DE MUJER', desc: 'PALABRA DE MUJER' },
];

/** `Boolean01()` del legado — lo reusan `comp_r`, `zcuo` y `ucuo`. */
export const OPCIONES_SI_NO: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: 'SI', desc: 'SI' },
  { id: 'NO', desc: 'NO' },
];

/** `TramoVenc01()` del legado — variable `tdcr`. */
export const OPCIONES_TRAMO_DIAS_GESTION: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: '0. 0 DÍAS', desc: '0. 0 DÍAS' },
  { id: '1. 1 a 2 DÍAS', desc: '1. 1 a 2 DÍAS' },
  { id: '2. 3 a 5 DÍAS', desc: '2. 3 a 5 DÍAS' },
  { id: '3. 6 a 10 DÍAS', desc: '3. 6 a 10 DÍAS' },
  { id: '4. 11 a 20 DÍAS', desc: '4. 11 a 20 DÍAS' },
  { id: '5. 21 a 30 DÍAS', desc: '5. 21 a 30 DÍAS' },
  { id: '6. MÁS DE 30 DÍAS', desc: '6. MÁS DE 30 DÍAS' },
  { id: '7. VACÍO', desc: '7. VACÍO' },
];

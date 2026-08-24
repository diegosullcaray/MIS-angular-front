import type { OpcionFiltro } from '../../../../../models/filtros.model';

/** `Mostrar_por()` del legado — variable `ver` de "Gestión de Cartera Reasignada". */
export const OPCIONES_MOSTRAR_POR: OpcionFiltro<number>[] = [
  { id: 0, desc: 'Operación' },
  { id: 1, desc: 'Saldo' },
];
export const MOSTRAR_POR_POR_DEFECTO = 0;

/** `filter1` de `repositorio/reasignado` — variable `imp` de "Efectividad por tramos". */
export const OPCIONES_IMPULSA: OpcionFiltro<number>[] = [
  { id: 1, desc: 'Total' },
  { id: 2, desc: 'Sin Impulsa' },
];
export const IMPULSA_POR_DEFECTO = 1;

/** Valor "sin filtrar" que comparten los filtros del detalle. */
export const TODO = 'TODO';

/** `Tramo01()` del legado — variable `tramof`. */
export const OPCIONES_TRAMO: OpcionFiltro[] = [
  { id: TODO, desc: 'TODO' },
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
export const OPCIONES_PRODUCTO_REASIGNADO: OpcionFiltro[] = [
  { id: TODO, desc: 'TODO' },
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
  { id: TODO, desc: 'TODO' },
  { id: 'SI', desc: 'SI' },
  { id: 'NO', desc: 'NO' },
];

/** `TramoVenc01()` del legado — variable `tdcr`. */
export const OPCIONES_TRAMO_DIAS_GESTION: OpcionFiltro[] = [
  { id: TODO, desc: 'TODO' },
  { id: '0. 0 DÍAS', desc: '0. 0 DÍAS' },
  { id: '1. 1 a 2 DÍAS', desc: '1. 1 a 2 DÍAS' },
  { id: '2. 3 a 5 DÍAS', desc: '2. 3 a 5 DÍAS' },
  { id: '3. 6 a 10 DÍAS', desc: '3. 6 a 10 DÍAS' },
  { id: '4. 11 a 20 DÍAS', desc: '4. 11 a 20 DÍAS' },
  { id: '5. 21 a 30 DÍAS', desc: '5. 21 a 30 DÍAS' },
  { id: '6. MÁS DE 30 DÍAS', desc: '6. MÁS DE 30 DÍAS' },
  { id: '7. VACÍO', desc: '7. VACÍO' },
];

/**
 * Los filtros que comparten las pestañas de detalle de los dos reportes del
 * host `cra-v11`/`cra-v12`, con los mismos valores por defecto del legado.
 */
export interface FiltrosDetalleComunes {
  /** `nom` — el legado lo manda entre comodines (`%texto%`). */
  asesor: string;
  /** `fcompro` — `TODO` o la fecha en `dd/MM/yyyy`. */
  fechaCompromiso: Date | null;
  /** `resp` — opciones que trae `SEL_EFEC_01`. */
  ultimaGestion: string;
  /** `pagen`, empezando en 1. */
  pagina: number;
}

export const FILTROS_DETALLE_INICIALES: FiltrosDetalleComunes = {
  asesor: '',
  fechaCompromiso: null,
  ultimaGestion: TODO,
  pagina: 1,
};

/** Traduce los filtros comunes a los parámetros exactos que espera el backend. */
export function paramsDetalleComunes(f: FiltrosDetalleComunes): Record<string, unknown> {
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  const fecha = f.fechaCompromiso;
  return {
    pagen: f.pagina,
    nom: `%${f.asesor}%`,
    resp: f.ultimaGestion,
    fcompro: fecha ? `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}` : TODO,
  };
}

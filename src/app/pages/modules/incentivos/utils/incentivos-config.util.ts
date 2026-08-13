import type { ConfiguracionUsuarioIncentivos } from '../models/incentivos-perfil.model';
import type { ItemAvance, ItemSemaforo, ItemSuperPlus } from '../models/incentivos-tablas.model';
import type { CalculadoraConfig, PlusCalculadora, VariableCalculadora } from '../models/incentivos-calculadora.model';
import type { NivelSelectorJerarquia } from '../models/incentivos-jerarquia.model';
import type { EtiquetasDetalle } from '../models/incentivos-detalle.model';

/**
 * Config estática del módulo Incentivos — migrado de `incentivos3.util.ts` +
 * `avances.util.ts`/`super-plus.util.ts`/`perfil.util.ts`/`calculadora.util.ts`
 * (legado STG). Iconos Material Symbols convertidos a su PrimeIcon más
 * cercano (PG-07 del TRD: PrimeIcons para el resto de iconografía).
 */
export const ICONOS_INCENTIVOS: Record<string, string> = {
  car: 'pi pi-wallet', // cartera
  cli: 'pi pi-users', // clientes
  sc1: 'pi pi-eye', // supervisión
  efec1: 'pi pi-clock', // efectividad -30 a 0
  efec2: 'pi pi-calendar', // efectividad 1 a 30
  efec3: 'pi pi-history', // efectividad 31 a 60
  prod: 'pi pi-chart-line', // productividad
  rop: 'pi pi-exclamation-triangle', // riesgo operativo
  clim: 'pi pi-sun', // clima
  clib: 'pi pi-credit-card', // bancarizados
  ret: 'pi pi-user-plus', // retención
  sis: 'pi pi-cog', // sistemática
  rot: 'pi pi-sync', // rotación
  tas: 'pi pi-percentage', // tasas
  gru: 'pi pi-sitemap', // variación de grupos
  pagop: 'pi pi-check-circle', // pago puntual
  tgru: 'pi pi-chart-bar', // tamaño de grupos
  areu: 'pi pi-calendar-check', // asistencia a reuniones
  acom: 'pi pi-dollar', // % asesores comisionan
};

/** Descripciones de cada variable — compartidas por perfil/avances/calculadora. */
export const DESCRIPCIONES: Record<string, string> = {
  car: 'Cartera Vigente',
  gru: 'Grupos',
  cli: 'Clientes',
  pagop: 'Pago Puntual',
  efec1: 'Efect. -30 a 0 días',
  efec2: 'Efect. 1 a 30 días',
  efec3: 'Efect. 31 a 60 días',
  sc1: 'Supervision C1',
  acom: '% Asesores Comisionan',
  prod: 'Productividad',
  rop: 'Riesgo Ope.',
  clim: 'Clima',
  clib: 'Bancarización',
  ret: 'Retención',
  tas: 'Tasas',
  rot: 'Rotación',
  sis: 'Sistemática',
  tgru: 'Tamaño Grupos',
  areu: 'Asis. Reuniones',
};

/**
 * Matriz de configuración por perfil de usuario (`indSecCfg`/`indUniCfg`/
 * `indCorCfg`/`gruSecCfg`/`gruUniCfg` del legado) — qué variables se
 * muestran/habilitan en cada pantalla según el tipo de cargo (`tip_cod`) y
 * clase de usuario (`cla_usu`, 1 individual / 2 grupal).
 */


export const CFG_INDIVIDUAL_SECTORISTA: ConfiguracionUsuarioIncentivos = {
  prof: ['car', 'cli', 'efec1', 'efec2', 'efec3'],
  avanS: ['car', 'cli', 'efec1', 'efec2', 'efec3'],
  avanE: ['car', 'cli', 'efec1', 'efec2', 'efec3'],
  avanFlex: 20,
  supS: ['prod', 'clib', 'ret', 'tas'],
  supE: ['prod', 'clib', 'tas'],
  calE: ['prod', 'clib', 'ret', 'tas'],
  calS: ['prod', 'clib', 'tas'],
};

export const CFG_INDIVIDUAL_UNIDAD: ConfiguracionUsuarioIncentivos = {
  prof: ['car', 'cli', 'sc1', 'efec1', 'efec2', 'efec3'],
  avanS: ['car', 'cli', 'sc1', 'efec1', 'efec2', 'efec3'],
  avanE: ['car', 'cli', 'efec1', 'efec2', 'efec3'],
  avanFlex: 16.66,
  supS: ['prod', 'clib', 'ret', 'tas'],
  supE: ['prod', 'clib', 'tas'],
  calE: ['prod', 'clib', 'ret', 'tas'],
  calS: ['prod', 'clib', 'tas'],
};

export const CFG_INDIVIDUAL_CORREDOR: ConfiguracionUsuarioIncentivos = {
  prof: ['car', 'cli', 'sc1', 'efec1', 'efec2', 'efec3'],
  avanS: ['car', 'cli', 'sc1', 'efec1', 'efec2', 'efec3'],
  avanE: ['car', 'cli', 'efec1', 'efec2', 'efec3'],
  avanFlex: 16.66,
  supS: ['prod', 'ret', 'tas', 'rop', 'clim', 'rot'],
  supE: ['prod', 'tas'],
  calE: ['prod', 'ret', 'tas'],
  calS: ['prod', 'tas', 'rop', 'clim', 'rot'],
};

export const CFG_GRUPAL_SECTORISTA: ConfiguracionUsuarioIncentivos = {
  prof: ['car', 'cli', 'pagop', 'efec2'],
  avanS: ['car', 'cli', 'pagop', 'efec2'],
  avanE: ['car', 'cli', 'efec2'],
  avanFlex: 20,
  supS: ['tgru', 'areu', 'ret'],
  supE: [],
  calE: ['tgru', 'areu', 'ret'],
  calS: ['tgru', 'areu'],
};

export const CFG_GRUPAL_UNIDAD: ConfiguracionUsuarioIncentivos = {
  prof: ['car', 'cli', 'pagop', 'efec2', 'sc1', 'acom'],
  avanS: ['car', 'cli', 'pagop', 'efec2', 'sc1', 'acom'],
  avanE: ['car', 'cli', 'efec2'],
  avanFlex: 20,
  supS: ['tgru', 'areu', 'ret'],
  supE: [],
  calE: ['tgru', 'areu', 'ret'],
  calS: ['tgru', 'areu'],
};

/**
 * Resuelve la matriz de configuración aplicable — igual `if/else` que
 * `setDs()` del legado (`incentivos3.service.ts`).
 */
export function resolverConfiguracionUsuario(tipCod: number, claUsu: number): ConfiguracionUsuarioIncentivos {
  if (tipCod === 1) {
    return claUsu === 1 ? CFG_INDIVIDUAL_SECTORISTA : CFG_GRUPAL_SECTORISTA;
  }
  if (tipCod === 18) {
    return claUsu === 1 ? CFG_INDIVIDUAL_UNIDAD : CFG_GRUPAL_UNIDAD;
  }
  return claUsu === 1 ? CFG_INDIVIDUAL_CORREDOR : CFG_GRUPAL_UNIDAD;
}

/** Niveles del selector de jerarquía habilitados por encima del nivel Asesor (`btns` del legado). */
export const NIVELES_SELECTOR_JERARQUIA: NivelSelectorJerarquia[] = [
  { etiqueta: 'Unidades', tipCodListado: 18 },
  { etiqueta: 'Corredores', tipCodListado: 19 },
  { etiqueta: 'Territorios', tipCodListado: 20 },
];

const IDS_SEMAFORO = ['car', 'gru', 'cli', 'pagop', 'efec1', 'efec2', 'efec3', 'sc1', 'acom'];
const IDS_AVANCES = IDS_SEMAFORO;
const IDS_SUPER_PLUS = ['prod', 'rop', 'clim', 'clib', 'ret', 'tas', 'rot', 'sis', 'tgru', 'areu'];
const IDS_CALCULADORA_VARS = ['car', 'gru', 'cli', 'pagop', 'efec1', 'efec2', 'efec3', 'sc1', 'acom'];
const IDS_CALCULADORA_PLUS = IDS_SUPER_PLUS;

/** Parámetros del diálogo de detalle por ítem de Super Plus (`params` de `super-plus.util.ts`). */
const PARAMETROS_DETALLE_SUPER_PLUS: Record<string, ItemSuperPlus['parametros']> = {
  prod: { comp: 1, req: 'getProd', card: true, typ: 'sp' },
  clib: { comp: 2, req: 'getCliBanc', card: false },
  ret: { comp: 1, req: 'getRetencion', card: false, typ: 'sp' },
  tas: { comp: 1, req: 'getTasa', card: false, typ: 'sp' },
};

export function crearPerfilSemDefault(): ItemSemaforo[] {
  return IDS_SEMAFORO.map((id) => ({ id, des: DESCRIPCIONES[id], icono: ICONOS_INCENTIVOS[id], val: 0, show: false }));
}

export function crearAvancesDefault(): ItemAvance[] {
  return IDS_AVANCES.map((id) => ({
    id,
    des: DESCRIPCIONES[id],
    icono: ICONOS_INCENTIVOS[id],
    val: 0,
    per: 0,
    sit: 0,
    show: false,
    enab: false,
  }));
}

export function crearSuperPlusDefault(): ItemSuperPlus[] {
  return IDS_SUPER_PLUS.map((id) => ({
    id,
    des: DESCRIPCIONES[id],
    icono: ICONOS_INCENTIVOS[id],
    val: 0,
    show: false,
    enab: false,
    estado: 1,
    parametros: PARAMETROS_DETALLE_SUPER_PLUS[id] ?? { comp: 1, req: 'getProd', card: false },
  }));
}

export function crearCalculadoraVariablesDefault(): VariableCalculadora[] {
  return IDS_CALCULADORA_VARS.map((id) => ({
    id,
    des: DESCRIPCIONES[id],
    icono: ICONOS_INCENTIVOS[id],
    formato: id === 'pagop' || id.startsWith('efec') ? 'percent' : 'number',
    key: `v_${id}`,
    bob: 0,
    bop: 0,
    met: 0,
    val: 0,
    show: false,
  }));
}

export function crearCalculadoraPlusDefault(): PlusCalculadora[] {
  const sumaFalse = new Set(['ret']);
  return IDS_CALCULADORA_PLUS.map((id) => ({
    id,
    des: DESCRIPCIONES[id],
    icono: ICONOS_INCENTIVOS[id],
    formato: id === 'ret' || id === 'tas' ? 'percent' : 'number',
    key: `p_${id}`,
    val: 0,
    bos: 0,
    enab: false,
    show: false,
    suma: !sumaFalse.has(id),
  }));
}

/** Índice (1-based) del ítem dentro de `IDS_SUPER_PLUS` — mismo orden fijo que usaba `superPlusConfig.data` del legado para calcular `idx` en `showDetail(item, i+1)`. */
export const INDICE_SUPER_PLUS: Record<string, number> = Object.fromEntries(IDS_SUPER_PLUS.map((id, i) => [id, i + 1]));

/** Etiquetas de las 3 tarjetas KPI + nota al pie del diálogo de detalle, por `cod_var` — `detalleConfig.items`/`.items2` del legado (título/ícono ya no se duplican acá: se usan directo del ítem de origen, ver `DetalleVariableDialogComponent`). */


const NOTA_ZONIFICACION = '*Valores netos no incluyen desembolsos fuera de la zonificación y créditos a trabajadores FC';
const NOTA_IMPULSA = '* Valores netos no incluyen producto Impulsa Mi Perú';

/** `typ:'cv'` — `codVar` 91 se trata como 1 (misma normalización `idx==91?1:idx` del legado). */
export const ETIQUETAS_DETALLE_VARIABLE: Record<number, EtiquetasDetalle> = {
  1: { tarjetas: ['Saldo', 'Var. Mensual', 'Meta'], nota: NOTA_ZONIFICACION },
  2: { tarjetas: ['Clientes', 'Var. Mensual', 'Meta'], nota: NOTA_ZONIFICACION },
  4: { tarjetas: ['Efectividad', 'Dist. Meta', 'Meta'], nota: NOTA_IMPULSA },
  5: { tarjetas: ['Efectividad', 'Dist. Meta', 'Meta'], nota: NOTA_IMPULSA },
  6: { tarjetas: ['Efectividad', 'Dist. Meta', 'Meta'], nota: NOTA_IMPULSA },
};

/** `typ:'sp'` — solo `prod`(1) y `tas`(6) tienen tarjetas reales en el legado (el resto de super-plus con detalle nunca llegan a habilitarse para ningún perfil). */
export const ETIQUETAS_DETALLE_SUPER_PLUS: Record<number, EtiquetasDetalle> = {
  1: { tarjetas: ['Productividad', 'Var. Mensual', 'Meta'], nota: NOTA_ZONIFICACION },
};

export function crearCalculadoraDefault(): CalculadoraConfig {
  return {
    variables: crearCalculadoraVariablesDefault(),
    plus: crearCalculadoraPlusDefault(),
    bonoBase: 0,
    bonoPlus: 0,
    bonoSuperPlus: 0,
    bonoTotal: 0,
    activo: 0,
    margenRenovacion: 0,
    claseUsuario: 0,
  };
}

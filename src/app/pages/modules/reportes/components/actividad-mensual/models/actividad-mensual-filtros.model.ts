import type { OpcionFiltro } from '../../../../../../shared/ui/formularios/opcion-filtro.model';

export type { OpcionFiltro };

/** `SCARGAAMBIENTAL()` del legado — variable `cargambiental` de "Huella Carbono". */
export const OPCIONES_CARGA_AMBIENTAL: OpcionFiltro[] = [
  { id: 'TODOS', desc: 'Todos' },
  { id: '45130106010000', desc: 'Energia' },
  { id: '45130106020000', desc: 'Agua' },
  { id: '45130111010105', desc: 'Combustibles' },
  { id: '45130111010113', desc: 'Papel' },
  { id: '45130101040000', desc: 'Aéreos' },
];
export const CARGA_AMBIENTAL_POR_DEFECTO = 'TODOS';

/** `SCANALRED()` del legado — variable `canal` de "Resultados por Unidad de Negocio". */
export const OPCIONES_CANAL_RED: OpcionFiltro[] = [
  { id: 'RED', desc: 'Red' },
];
export const CANAL_RED_POR_DEFECTO = 'RED';

/** `Productos01()` del legado — variable `prod` de "Evolutivo Cosechas" y "Semáforo Cosechas". */
export const OPCIONES_PRODUCTO_COSECHAS: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: 'AGROPECUARIO', desc: 'AGROPECUARIO' },
  { id: 'CONSTRUYENDO CONFIANZA', desc: 'CONSTRUYENDO CONFIANZA' },
  { id: 'CONSUMO', desc: 'CONSUMO' },
  { id: 'EMPRENDIENDO CONFIANZA', desc: 'EMPRENDIMIENTO CONFIANZA' },
  { id: 'GARANTIA LIQUIDA', desc: 'GARANTIA LIQUIDA' },
  { id: 'PALABRA DE MUJER', desc: 'PALABRA DE MUJER' },
  { id: 'TRABAJADORES FC', desc: 'TRABAJADORES FC' },
  { id: 'HIPOTECARIO', desc: 'HIPOTECARIO' },
];
export const PRODUCTO_COSECHAS_POR_DEFECTO = 'TODO';

/** `SubProducto01()` del legado — variable `subpro` de "Evolutivo Cosechas" y "Semáforo Cosechas". */
export const OPCIONES_SUBPRODUCTO_COSECHAS: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: 'AGROPECUARIO CUOTAS', desc: 'AGRO CUOTAS' },
  { id: 'AGROPECUARIO VCTO', desc: 'AGRO VCTO' },
  { id: 'CONSTRUYENDO CONFIANZA', desc: 'CONSTRUYENDO CONFIANZA' },
  { id: 'CONSUMO CUOTAS', desc: 'CONSUMO' },
  { id: 'CRÉDITO EDUCATIVO', desc: 'CREDITO EDUCATIVO' },
  { id: 'EMPRENDIENDO CONFIANZA CUOTAS', desc: 'EMP CONFIANZA CUOTAS' },
  { id: 'EMPRENDIENDO CONFIANZA VCTO', desc: 'EMP CONFIANZA VTO' },
  { id: 'GARANTIA LIQUIDA', desc: 'GARANTIA LIQUIDA' },
  { id: 'HIPOTECARIO', desc: 'HIPOTECARIO' },
  { id: 'INICIANDO CONFIANZA', desc: 'INICIANDO CONFIANZA' },
  { id: 'PDM', desc: 'PDM' },
  { id: 'TRABAJADORES FC', desc: 'TRABAJADORES FC' },
];
export const SUBPRODUCTO_COSECHAS_POR_DEFECTO = 'TODO';

/** `Maduracion01()` del legado — variable `madu` de "Evolutivo Cosechas" y "Semáforo Cosechas". */
export const OPCIONES_MADURACION: OpcionFiltro[] = [
  { id: '3', desc: '3 MESES' },
  { id: '6', desc: '6 MESES' },
  { id: '9', desc: '9 MESES' },
  { id: '12', desc: '12 MESES' },
];
export const MADURACION_POR_DEFECTO = '3';

/** `Tipo03()` del legado — variable `op` de "Evolutivo Cosechas" y "Semáforo Cosechas". */
export const OPCIONES_TIPO_OPERACION_SALDO: OpcionFiltro[] = [
  { id: 'Saldo', desc: 'SALDO' },
  { id: 'Operacion', desc: 'OPERACION' },
];
export const TIPO_OPERACION_SALDO_POR_DEFECTO = 'Saldo';

/** `Mostrar_por()` del legado — variable `ver` de "Gestión de Cartera Reasignada" y "Gestión de Cartera Stock". */
export const OPCIONES_MOSTRAR_POR: OpcionFiltro<number>[] = [
  { id: 0, desc: 'Operación' },
  { id: 1, desc: 'Saldo' },
];
export const MOSTRAR_POR_POR_DEFECTO = 0;

/** `Tipo_asesor()` del legado — variable `tipo_ase` de "Gestión de Cartera Stock". */
export const OPCIONES_TIPO_ASESOR: OpcionFiltro<number>[] = [
  { id: 0, desc: 'Todo' },
  { id: 1, desc: 'Asesor Operativo' },
  { id: 2, desc: 'Asesor virtual' },
];
export const TIPO_ASESOR_POR_DEFECTO = 0;

/** `SPRODUCTO()` del legado — variable `prod` de "Captación por Canal Comercial" y "Operaciones". */
export const OPCIONES_PRODUCTO_PASIVO: OpcionFiltro[] = [
  { id: 'TODOS', desc: 'TODOS' },
  { id: 'AHORROS', desc: 'AHORROS' },
  { id: 'CTS', desc: 'CTS' },
  { id: 'PLAZO FIJO', desc: 'DPF' },
];
export const PRODUCTO_PASIVO_POR_DEFECTO = 'TODOS';

/** `Segmento()` del legado — variable `segmento` de "Captación Operacional". */
export const OPCIONES_SEGMENTO: OpcionFiltro[] = [
  { id: 'TODOS', desc: 'Todos' },
  { id: 'Mujer', desc: 'Mujer' },
  { id: 'Rural', desc: 'Rural' },
  { id: 'Urbano', desc: 'Urbano' },
  { id: 'Migrantes', desc: 'Migrantes' },
];
export const SEGMENTO_POR_DEFECTO = 'TODOS';

/** `varProducto()` del legado — variable `prod` de "Seguimiento BP". */
export const OPCIONES_PRODUCTO_BP: OpcionFiltro[] = [
  { id: 'TODOS', desc: 'Todos' },
  { id: 'Ahorros', desc: 'Ahorros' },
  { id: 'Plazo Fijo', desc: 'Plazo Fijo' },
  { id: 'Cts', desc: 'Cts' },
];
export const PRODUCTO_BP_POR_DEFECTO = 'TODOS';

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function formatoYYYYMMDD(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}${mes}${dia}`;
}

/** `renderDates_3()` del legado — variable `fec` de "Plan de Datos" (`app_uso_m`). */
export function generarOpcionesFechaBase(hoy: Date = new Date()): OpcionFiltro[] {
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  const mesBase = new Date(ayer.getFullYear(), ayer.getMonth(), 1);

  const opciones: OpcionFiltro[] = [{ id: formatoYYYYMMDD(ayer), desc: `${MESES_ES[ayer.getMonth()]} - ${ayer.getFullYear()}` }];
  for (let mesesAtras = 1; mesesAtras <= 11; mesesAtras++) {
    const finDeMes = new Date(mesBase.getFullYear(), mesBase.getMonth() - mesesAtras + 1, 0);
    opciones.push({ id: formatoYYYYMMDD(finDeMes), desc: `${MESES_ES[finDeMes.getMonth()]} - ${finDeMes.getFullYear()}` });
  }

  return opciones;
}

export function fechaBasePorDefecto(hoy: Date = new Date()): string {
  const opciones = generarOpcionesFechaBase(hoy);
  return opciones[1]?.id ?? opciones[0]?.id ?? '';
}

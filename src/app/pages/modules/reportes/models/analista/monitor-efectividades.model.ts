import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado de "Detalle Monitor de Efectividades Asesor" (`MonitorEfectividadesService.obtenerMonitorEfectividades`) — único bloque del legado (`RS_MON_EFEC_SEC_01`), "Expresado en PEN y %" (`content.higher` del legado). */
export interface ReporteMonitorEfectividades {
  tabla1: TablaReporteResultado;
}

export interface OpcionFiltroEfectividades {
  id: string;
  desc: string;
}

/** Filtros reales del legado (`crs-map.ts`: `Tramo01()`, `Producto01()`, `Boolean01()` x3, `TramoVenc01()`, `filter-locale.module.ts`) — todos con `TODO` por defecto. */
export const OPCIONES_TRAMO: OpcionFiltroEfectividades[] = [
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

export const OPCIONES_PRODUCTO: OpcionFiltroEfectividades[] = [
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

export const OPCIONES_SI_NO: OpcionFiltroEfectividades[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: 'SI', desc: 'SI' },
  { id: 'NO', desc: 'NO' },
];

export const OPCIONES_TRAMO_DIAS_GESTION: OpcionFiltroEfectividades[] = [
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

/** Estado de los 6 filtros del reporte — variables originales del legado (`tramof`/`prod`/`comp_r`/`zcuo`/`ucuo`/`tdcr`). */
export interface FiltrosMonitorEfectividades {
  tramof: string;
  prod: string;
  comp_r: string;
  zcuo: string;
  ucuo: string;
  tdcr: string;
}

export const FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO: FiltrosMonitorEfectividades = {
  tramof: 'TODO',
  prod: 'TODO',
  comp_r: 'TODO',
  zcuo: 'TODO',
  ucuo: 'TODO',
  tdcr: 'TODO',
};

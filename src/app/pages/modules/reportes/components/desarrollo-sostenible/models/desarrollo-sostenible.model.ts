import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../models/tabla-dinamica.model';
import type { KpiOperacionesDesembolsadas } from '../../avance-comercial/models/avance-comercial.model';

/** Opción del filtro "Productos" de `Monitor_Dese_misi` (legado: `SPRODUCTOMISI()`, `cra-map.ts`). */
export interface OpcionProductoMisional {
  id: string;
  desc: string;
}

/** Valores exactos del legado — variable enviada al backend es `prod` (spread-override en `cra-map.ts`). */
export const OPCIONES_PRODUCTO_MISIONAL: OpcionProductoMisional[] = [
  { id: 'TODOS', desc: 'TODOS' },
  { id: 'Agua y Saneamiento', desc: 'Agua y Saneamiento' },
  { id: 'Crédito Educativo', desc: 'Crédito Educativo' },
  { id: 'Emprendimiento Mujer', desc: 'Emprendimiento Mujer' },
  { id: 'Producto verde', desc: 'Crédito Verde' },
];

/** Opción del filtro "Productos" del panel `prod_misi_*` (legado: `panel-misionales.util.ts`, `filter1`). */
export interface OpcionProductoMisionalPanel {
  id: string;
  desc: string;
}

/** Valores exactos del legado — variable enviada al backend es `prod`. Distintos de `OPCIONES_PRODUCTO_MISIONAL` (otro backend, `Monitor_Dese_misi`). */
export const OPCIONES_PRODUCTO_MISIONAL_PANEL: OpcionProductoMisionalPanel[] = [
  { id: 'Todos', desc: 'Todos' },
  { id: 'Agua y Saneamiento', desc: 'Agua y Saneamiento' },
  { id: 'Crédito Educativo', desc: 'Crédito Educativo' },
  { id: 'Emprendimiento Mujer', desc: 'Emprendimiento Mujer' },
  { id: 'Producto Verde', desc: 'Crédito Verde' },
];

/** Resultado combinado de "Monitor Productos Misionales" (`DesarrolloSostenibleService.obtenerMonitorProductosMisionales`). */
export interface ReporteMonitorProductosMisionales {
  kpiOperaciones: KpiOperacionesDesembolsadas | null;
  /** Tabla diaria completa del bloque `_01` (Día/Fecha/Diario/Acumulado/% Requerido) — el mismo bloque cuyo `additional` alimenta `kpiOperaciones`. */
  tablaDetalle: TablaReporteResultado;
  tablaSimple: TablaReporteResultado;
}

/** Resultado combinado de "Productos Misionales" (`DesarrolloSostenibleService.obtenerProductosMisionales`). */
export interface ReporteProductosMisionales {
  resumen: TablaDinamicaResultado;
  territorio: TablaDinamicaResultado;
  corredores: TablaDinamicaResultado;
  unidad: TablaDinamicaResultado;
  asesores: TablaDinamicaResultado;
}

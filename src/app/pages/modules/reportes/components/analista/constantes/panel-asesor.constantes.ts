import type { DominioPanelDef, ReportePanelAsesor } from '../models/panel-asesor.model';

/** Tarjetas del panel, en el orden de la maqueta. */
export const DOMINIOS_PANEL: readonly DominioPanelDef[] = [
  { id: 'cartera', nombre: 'Cartera', pestana: 'Cartera', icono: 'pi pi-briefcase' },
  { id: 'clientes', nombre: 'Clientes', pestana: 'Clientes', icono: 'pi pi-users' },
  { id: 'colocacion', nombre: 'Colocación · metas', pestana: 'Colocación', icono: 'pi pi-flag' },
  { id: 'tasas', nombre: 'Autonomía de tasas', pestana: 'Tasas', icono: 'pi pi-percentage' },
  { id: 'seguros', nombre: 'Seguros', pestana: 'Seguros', icono: 'pi pi-shield' },
  { id: 'mora', nombre: 'Recuperación y mora', pestana: 'Mora', icono: 'pi pi-exclamation-circle', alerta: true },
];

/** Reporte con filtros propios dentro del panel. */
export const CODIGO_EFECTIVIDADES = 'L_MON_EFE_DET_SEC';

/** Vista consolidada (no es un `SCODSEC`): Grupos PDM, Clientes Nuevos y Recurrentes y Clientes Producto. */
export const CODIGO_CLIENTES_CONSOLIDADO = 'PANEL_CLIENTES';

/** Reportes del panel; cada uno se muestra en el detalle de su dominio. */
export const REPORTES_ASESOR: readonly ReportePanelAsesor[] = [
  { codigo: 'L_CART_SEC', nombre: 'Cartera', dominio: 'cartera' },
  { codigo: 'L_MONI_DESE_SEC', nombre: 'Monitor Metas Desembolso', dominio: 'colocacion' },
  {
    codigo: CODIGO_EFECTIVIDADES,
    nombre: 'Detalle de efectividades',
    dominio: 'mora',
    bloques: [{ tabla: 'tabla1', titulo: 'Detalle de efectividades', chip: 'Expresado en PEN y %' }],
  },
  {
    codigo: CODIGO_CLIENTES_CONSOLIDADO,
    nombre: 'Clientes y Grupos PDM',
    dominio: 'clientes',
    bloques: [
      { tabla: 'tabla2', titulo: 'Clientes nuevos y recurrentes' },
      // El legado no los titula: se numeran.
      { tabla: 'tabla3', titulo: 'Clientes por producto · 1 de 3' },
      { tabla: 'tabla4', titulo: 'Clientes por producto · 2 de 3' },
      { tabla: 'tabla5', titulo: 'Clientes por producto · 3 de 3' },
      { tabla: 'tabla1', titulo: 'Grupos PDM' },
    ],
  },
  {
    codigo: 'L_SEG_SEC',
    nombre: 'Seguros',
    dominio: 'seguros',
    bloques: [{ tabla: 'tabla1', titulo: 'Seguros', chip: 'Expresado en PEN y %' }],
  },
  {
    codigo: 'L_REC_PREVE_SEC',
    nombre: 'Recuperación Preventiva',
    dominio: 'mora',
    bloques: [{ tabla: 'tabla1', titulo: 'Recuperación preventiva' }],
  },
  {
    codigo: 'L_REP_AUTO_SEC',
    nombre: 'Autonomía de Tasas',
    dominio: 'tasas',
    bloques: [
      { tabla: 'tabla1', titulo: 'Resumen Gestión de Tasas' },
      { tabla: 'tabla2', titulo: 'Número de Operaciones Desembolsadas por Producto' },
      { tabla: 'tabla3', titulo: 'Monto Desembolsado por Producto' },
      { tabla: 'tabla4', titulo: 'TAPP Mes de Operaciones Desembolsadas por Producto' },
    ],
  },
];

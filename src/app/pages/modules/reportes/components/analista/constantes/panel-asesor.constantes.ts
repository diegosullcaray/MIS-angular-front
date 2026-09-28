import type { GrupoPanelAsesorDef, ReportePanelAsesor } from '../models/panel-asesor.model';

/** Categorías de la navegación; el orden final lo decide el tráfico de sus reportes (ver `gruposOrdenados`). */
export const GRUPOS_PANEL_ASESOR: readonly GrupoPanelAsesorDef[] = [
  { id: 'cartera', nombre: 'Cartera y clientes', icono: 'pi pi-briefcase' },
  { id: 'colocacion', nombre: 'Colocación y negocio', icono: 'pi pi-chart-line' },
  { id: 'recuperacion', nombre: 'Recuperación y mora', icono: 'pi pi-exclamation-circle' },
];

/** Reporte con filtros propios dentro del panel. */
export const CODIGO_EFECTIVIDADES = 'L_MON_EFE_DET_SEC';

/**
 * Vista consolidada del panel (no es un `SCODSEC` del menú): reúne Grupos PDM (`L_GPDM_SEC`),
 * Clientes Nuevos y Recurrentes (`L_CLI_NUEVRE_SEC`) y Clientes Producto (`L_CLI_PROD_SEC`).
 */
export const CODIGO_CLIENTES_CONSOLIDADO = 'PANEL_CLIENTES';

/**
 * Reportes del asesor en orden de tráfico histórico (peticiones del menú legacy).
 * Títulos de bloque y notas copiados de cada pantalla migrada en `items/`.
 */
export const REPORTES_ASESOR: readonly ReportePanelAsesor[] = [
  {
    codigo: 'L_CART_SEC',
    nombre: 'Cartera',
    ruta: '/app/reportes/leg/com/rda/sec/cartera',
    peticiones: 29668,
    descripcion: 'Saldo, clientes y composición de tu cartera.',
    grupo: 'cartera',
    icono: 'pi pi-wallet',
  },
  {
    codigo: 'L_MONI_DESE_SEC',
    nombre: 'Monitor Metas Desembolso',
    ruta: '/app/reportes/leg/com/rda/sec/mon-desem',
    peticiones: 14601,
    descripcion: 'Tu avance de desembolsos frente a la meta.',
    grupo: 'colocacion',
    icono: 'pi pi-flag',
  },
  {
    codigo: 'L_MON_EFE_DET_SEC',
    nombre: 'Detalle de efectividades',
    ruta: '/app/reportes/leg/com/rda/sec/mon_efec_sec',
    peticiones: 10137,
    descripcion: 'Seguimiento de resultados de tu gestión de cobranza.',
    grupo: 'recuperacion',
    icono: 'pi pi-check-square',
    bloques: [{ tabla: 'tabla1', chip: 'Expresado en PEN y %' }],
  },
  {
    codigo: CODIGO_CLIENTES_CONSOLIDADO,
    nombre: 'Clientes y Grupos PDM',
    ruta: '/app/reportes/leg/com/rda/sec/cli-nue-rec',
    // Suma del tráfico de los tres reportes que reúne.
    peticiones: 4076 + 2772 + 1838,
    descripcion: 'Grupos PDM, clientes nuevos y recurrentes, y clientes por producto en una sola vista.',
    grupo: 'cartera',
    icono: 'pi pi-users',
    bloques: [
      { tabla: 'tabla1', titulo: 'Grupos PDM' },
      { tabla: 'tabla2', titulo: 'Clientes Nuevos y Recurrentes' },
      { tabla: 'tabla3', titulo: 'Clientes Producto · 1 de 3' },
      { tabla: 'tabla4', titulo: 'Clientes Producto · 2 de 3' },
      { tabla: 'tabla5', titulo: 'Clientes Producto · 3 de 3' },
    ],
  },
  {
    codigo: 'L_SEG_SEC',
    nombre: 'Seguros',
    ruta: '/app/reportes/leg/com/rda/sec/seg',
    peticiones: 1380,
    descripcion: 'Tu gestión de seguros.',
    grupo: 'colocacion',
    icono: 'pi pi-shield',
    bloques: [{ tabla: 'tabla1', chip: 'Expresado en PEN y %' }],
  },
  {
    codigo: 'L_REC_PREVE_SEC',
    nombre: 'Recuperación Preventiva',
    ruta: '/app/reportes/leg/com/rda/sec/rec-prev',
    peticiones: 845,
    descripcion: 'Anticipa acciones de recuperación.',
    grupo: 'recuperacion',
    icono: 'pi pi-bell',
  },
  {
    codigo: 'L_REP_AUTO_SEC',
    nombre: 'Autonomía de Tasas',
    ruta: '/app/reportes/leg/com/rda/sec/aut-tasa',
    peticiones: 623,
    descripcion: 'Gestión de tasas y desembolsos por producto.',
    grupo: 'colocacion',
    icono: 'pi pi-percentage',
    bloques: [
      { tabla: 'tabla1', titulo: 'Resumen Gestión de Tasas' },
      { tabla: 'tabla2', titulo: 'Número de Operaciones Desembolsadas por Producto' },
      { tabla: 'tabla3', titulo: 'Monto Desembolsado por Producto' },
      { tabla: 'tabla4', titulo: 'TAPP Mes de Operaciones Desembolsadas por Producto' },
    ],
  },
];

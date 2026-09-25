import { CRITERIOS_MOVILIDAD } from '../models/planilla-movilidad.model';
import type { GrupoPanelAsesorDef, ReportePanelAsesor } from '../models/panel-asesor.model';

/** Categorías de la navegación; el orden final lo decide el tráfico de sus reportes (ver `gruposOrdenados`). */
export const GRUPOS_PANEL_ASESOR: readonly GrupoPanelAsesorDef[] = [
  { id: 'cartera', nombre: 'Cartera y clientes', icono: 'pi pi-briefcase' },
  { id: 'colocacion', nombre: 'Colocación y negocio', icono: 'pi pi-chart-line' },
  { id: 'recuperacion', nombre: 'Recuperación y mora', icono: 'pi pi-exclamation-circle' },
  { id: 'gestion', nombre: 'Movilidad y gestión', icono: 'pi pi-map' },
];

/** Reportes que alimentan la vista 360: los dos más consultados y la evolución de mora. */
export const CODIGOS_RESUMEN_ASESOR = ['L_CART_SEC', 'L_MONI_DESE_SEC', 'L_INVERS_STOCK_SEC'] as const;

/** Reporte con filtros propios dentro del panel. */
export const CODIGO_EFECTIVIDADES = 'L_MON_EFE_DET_SEC';

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
    codigo: 'L_GPDM_SEC',
    nombre: 'Grupos PDM',
    ruta: '/app/reportes/leg/com/rda/sec/pdm',
    peticiones: 4076,
    descripcion: 'Grupos por vencer y su seguimiento.',
    grupo: 'cartera',
    icono: 'pi pi-users',
  },
  {
    codigo: 'L_CLI_NUEVRE_SEC',
    nombre: 'Clientes Nuevos y Recurrentes',
    ruta: '/app/reportes/leg/com/rda/sec/cli-nue-rec',
    peticiones: 2772,
    descripcion: 'Evolución de tus clientes nuevos y recurrentes.',
    grupo: 'cartera',
    icono: 'pi pi-user-plus',
  },
  {
    codigo: 'L_CLI_PROD_SEC',
    nombre: 'Clientes Producto',
    ruta: '/app/reportes/leg/com/rda/sec/cli-prod',
    peticiones: 1838,
    descripcion: 'Tus clientes por producto.',
    grupo: 'cartera',
    icono: 'pi pi-box',
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
    codigo: 'L_CER_CUO_SEC',
    nombre: 'Cero y Una Cuota',
    ruta: '/app/reportes/leg/com/rda/sec/zu-cuo',
    peticiones: 1276,
    descripcion: 'Clientes con cero o una cuota pagada para seguimiento.',
    grupo: 'recuperacion',
    icono: 'pi pi-exclamation-triangle',
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
    codigo: 'L_CAPT_SEC',
    nombre: 'Captaciones',
    ruta: '/app/reportes/leg/com/rda/sec/capta',
    peticiones: 644,
    descripcion: 'Saldos y captaciones de tus clientes.',
    grupo: 'cartera',
    icono: 'pi pi-building-columns',
    bloques: [{ tabla: 'tabla1' }, { tabla: 'tabla2' }, { tabla: 'tabla3', titulo: 'Ahorro Programado' }],
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
  {
    codigo: 'L_PLAN_SEC',
    nombre: 'Planilla Movilidad',
    ruta: '/app/reportes/leg/com/rda/sec/plan-mov-sec',
    peticiones: 613,
    descripcion: 'Tu planilla de gastos por movilidad.',
    grupo: 'gestion',
    icono: 'pi pi-car',
    bloques: [
      { tabla: 'tabla2', titulo: 'Cascada de filtros aplicados' },
      { tabla: 'tabla1', titulo: 'Planilla de Gastos por Movilidad - Asesores' },
      { tabla: 'tabla3', titulo: 'Válidos', nota: CRITERIOS_MOVILIDAD },
      { tabla: 'tabla4', titulo: 'Depurados', nota: CRITERIOS_MOVILIDAD },
    ],
  },
  {
    codigo: 'L_RES_MOV_ASESOR',
    nombre: 'Resumen Movilidad',
    ruta: '/app/reportes/leg/com/rda/sec/res-mov-sec',
    peticiones: 548,
    descripcion: 'Resumen de tu movilidad.',
    grupo: 'gestion',
    icono: 'pi pi-directions',
  },
  {
    codigo: 'L_INVERS_STOCK_SEC',
    nombre: 'Inversión y Stock de Mora',
    ruta: '/app/reportes/leg/com/rda/sec/inv-stk',
    peticiones: 522,
    descripcion: 'Evolución de la inversión y el stock de mora.',
    grupo: 'recuperacion',
    icono: 'pi pi-chart-bar',
    tipoGrafico: 'linea',
  },
  {
    codigo: 'L_DESEMP_SOC_SEC',
    nombre: 'Desempeño Social',
    ruta: '/app/reportes/leg/com/rda/sec/desempeno-social-as',
    peticiones: 481,
    descripcion: 'Tus indicadores de desempeño social.',
    grupo: 'gestion',
    icono: 'pi pi-heart',
  },
  {
    codigo: 'L_PROYDIAOPERSEC',
    nombre: 'Proyección diaria',
    ruta: '/app/reportes/leg/com/rda/sec/proy_M6',
    peticiones: 473,
    descripcion: 'Proyección diaria de operaciones, colocaciones y efectividades.',
    grupo: 'colocacion',
    icono: 'pi pi-calendar',
    bloques: [
      { tabla: 'tabla1', titulo: 'Proyección Diaria por Operaciones' },
      { tabla: 'tabla2', titulo: 'Proyección Diaria por Colocaciones' },
      { tabla: 'tabla3', titulo: 'Proyección Diaria por Efectividades' },
    ],
  },
  {
    codigo: 'L_REG_PROS_SEC',
    nombre: 'Prospecto Corresponsal',
    ruta: '/app/reportes/leg/com/rda/sec/sec-prosp',
    peticiones: 443,
    descripcion: 'Tus prospectos corresponsales registrados.',
    grupo: 'colocacion',
    icono: 'pi pi-map-marker',
  },
];

import type { DominioPanelDef, ReportePanelAsesor } from '../models/panel-asesor.model';

/**
 * Tarjetas del tablero del asesor, en el orden de la maqueta (`governance/tasks/panel unificado
 * asesor`): tres de cartera y negocio arriba, tres de tasas, seguros y mora abajo.
 */
export const DOMINIOS_PANEL: readonly DominioPanelDef[] = [
  { id: 'cartera', nombre: 'Cartera', pestana: 'Cartera', subtitulo: 'Presupuesto, stock, tasas y calidad de la cartera', icono: 'pi pi-briefcase' },
  { id: 'clientes', nombre: 'Clientes', pestana: 'Clientes', subtitulo: 'Nuevos, recurrentes y distribución por producto', icono: 'pi pi-users' },
  { id: 'colocacion', nombre: 'Colocación · metas', pestana: 'Colocación', subtitulo: 'Monitor de metas de desembolso del mes', icono: 'pi pi-flag' },
  { id: 'tasas', nombre: 'Autonomía de tasas', pestana: 'Tasas', subtitulo: 'Resumen de gestión de tasas por nivel de autonomía', icono: 'pi pi-percentage' },
  { id: 'seguros', nombre: 'Seguros', pestana: 'Seguros', subtitulo: 'Pólizas del mes y stock', icono: 'pi pi-shield' },
  { id: 'mora', nombre: 'Recuperación y mora', pestana: 'Mora', subtitulo: 'Efectividad de gestión y cartera por vencer', icono: 'pi pi-exclamation-circle', alerta: true },
];

/** Reporte con filtros propios dentro del panel. */
export const CODIGO_EFECTIVIDADES = 'L_MON_EFE_DET_SEC';

/**
 * Vista consolidada del panel (no es un `SCODSEC` del menú): reúne Grupos PDM (`L_GPDM_SEC`),
 * Clientes Nuevos y Recurrentes (`L_CLI_NUEVRE_SEC`) y Clientes Producto (`L_CLI_PROD_SEC`).
 */
export const CODIGO_CLIENTES_CONSOLIDADO = 'PANEL_CLIENTES';

/**
 * Reportes del asesor en orden de tráfico histórico (peticiones del menú legacy). Cada uno se
 * muestra en el detalle de su dominio. Títulos de bloque y notas copiados de cada pantalla migrada
 * en `items/`.
 */
export const REPORTES_ASESOR: readonly ReportePanelAsesor[] = [
  {
    codigo: 'L_CART_SEC',
    nombre: 'Cartera',
    ruta: '/app/reportes/leg/com/rda/sec/cartera',
    peticiones: 29668,
    descripcion: 'Saldo, clientes y composición de tu cartera.',
    dominio: 'cartera',
    icono: 'pi pi-wallet',
  },
  {
    codigo: 'L_MONI_DESE_SEC',
    nombre: 'Monitor Metas Desembolso',
    ruta: '/app/reportes/leg/com/rda/sec/mon-desem',
    peticiones: 14601,
    descripcion: 'Tu avance de desembolsos frente a la meta.',
    dominio: 'colocacion',
    icono: 'pi pi-flag',
  },
  {
    codigo: CODIGO_EFECTIVIDADES,
    nombre: 'Detalle de efectividades',
    ruta: '/app/reportes/leg/com/rda/sec/mon_efec_sec',
    peticiones: 10137,
    descripcion: 'Seguimiento de resultados de tu gestión de cobranza.',
    dominio: 'mora',
    icono: 'pi pi-check-square',
    bloques: [{ tabla: 'tabla1', titulo: 'Detalle de efectividades', chip: 'Expresado en PEN y %' }],
  },
  {
    codigo: CODIGO_CLIENTES_CONSOLIDADO,
    nombre: 'Clientes y Grupos PDM',
    ruta: '/app/reportes/leg/com/rda/sec/cli-nue-rec',
    // Suma del tráfico de los tres reportes que reúne.
    peticiones: 4076 + 2772 + 1838,
    descripcion: 'Grupos PDM, clientes nuevos y recurrentes, y clientes por producto en una sola vista.',
    dominio: 'clientes',
    icono: 'pi pi-users',
    bloques: [
      { tabla: 'tabla2', titulo: 'Clientes nuevos y recurrentes' },
      // El legado no los titula: se numeran en vez de inventarles un nombre de negocio.
      { tabla: 'tabla3', titulo: 'Clientes por producto · 1 de 3' },
      { tabla: 'tabla4', titulo: 'Clientes por producto · 2 de 3' },
      { tabla: 'tabla5', titulo: 'Clientes por producto · 3 de 3' },
      { tabla: 'tabla1', titulo: 'Grupos PDM' },
    ],
  },
  {
    codigo: 'L_SEG_SEC',
    nombre: 'Seguros',
    ruta: '/app/reportes/leg/com/rda/sec/seg',
    peticiones: 1380,
    descripcion: 'Tu gestión de seguros.',
    dominio: 'seguros',
    icono: 'pi pi-shield',
    bloques: [{ tabla: 'tabla1', titulo: 'Seguros', chip: 'Expresado en PEN y %' }],
  },
  {
    codigo: 'L_REC_PREVE_SEC',
    nombre: 'Recuperación Preventiva',
    ruta: '/app/reportes/leg/com/rda/sec/rec-prev',
    peticiones: 845,
    descripcion: 'Anticipa acciones de recuperación.',
    dominio: 'mora',
    icono: 'pi pi-bell',
    bloques: [{ tabla: 'tabla1', titulo: 'Recuperación preventiva' }],
  },
  {
    codigo: 'L_REP_AUTO_SEC',
    nombre: 'Autonomía de Tasas',
    ruta: '/app/reportes/leg/com/rda/sec/aut-tasa',
    peticiones: 623,
    descripcion: 'Gestión de tasas y desembolsos por producto.',
    dominio: 'tasas',
    icono: 'pi pi-percentage',
    bloques: [
      { tabla: 'tabla1', titulo: 'Resumen Gestión de Tasas' },
      { tabla: 'tabla2', titulo: 'Número de Operaciones Desembolsadas por Producto' },
      { tabla: 'tabla3', titulo: 'Monto Desembolsado por Producto' },
      { tabla: 'tabla4', titulo: 'TAPP Mes de Operaciones Desembolsadas por Producto' },
    ],
  },
];

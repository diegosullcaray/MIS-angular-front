/**
 * Códigos de reporte (`cod_rep`) del módulo Analista (legado `rda/sectorista`).
 *
 * Todos consultan por asesor (`tip_cod`/`cod_rel` de la persona), no por
 * jerarquía. Los que empiezan con `rda/sectorista/...` van por el strand
 * deprecado (`reportData`); el resto, por `regularData`.
 */
export const COD_ANALISTA = {
  /** Autonomías. */
  autonomias: 'LST_AUT_01',
  /** Campaña Ágil — lleva el número de semana en `sem`. */
  campanaAgil: 'rda/sectorista/campania_agil/campana_agil_sec_01',
  /** Canal Alterno. */
  canalAlterno: 'rda/sectorista/canal_alt/canal_alt_sec_01',
  /** Cero Cuotas. */
  ceroCuotas: 'rda/sectorista/cero_cuota/cero_cuota_sec_01',
  /** Clientes Nuevos y Recurrentes. */
  clientesNuevosRecurrentes: 'rda/sectorista/clientes_nuevos_recurrente/cliente_nuevo_rec_01',
  /** Clientes Potenciales. */
  clientesPotenciales: 'rda/sectorista/cli_pot/cli_pot_sec_01',
  /** Clientes Reprogramados — listado. */
  clientesReprogramados: 'RES_SEC_REP_01',
  /** Clientes Reprogramados — guardado del formulario (`postRegularUpdate`). */
  clientesReprogramadosGuardar: 'UP_REPRO_01',
  /** Datos de Clientes — detalle. */
  datosClientes: 'DET_CLI_01',
  /** Datos de Clientes — catálogo de ciudades. */
  datosClientesCiudades: 'SEL_CIU_01',
  /** Datos de Clientes — guardado del formulario (`postRegularUpdate`). */
  datosClientesGuardar: 'UPD_CLI_01',
  /** Desempeño Social. */
  desempenoSocial: 'DESE_SOC_AS_01',
  /** Encuesta de Clientes — listado. */
  encuestaClientes: 'LIS_CAPRET_01',
  /** Encuesta de Clientes — catálogo CIIU. */
  encuestaClientesCiiu: 'SEL_CIU_02',
  /** Encuesta de Clientes — guardado (`postRegularUpdate`). */
  encuestaClientesGuardar: 'UPD_CAPRET_01',
  /** Grupos por Vencer. */
  gruposPorVencer: 'rda/sectorista/grupo_pdm/grupo_pdm_sec_01',
  /** Inversión, Stock y Mora — bloques de gráfico (`graphicData`). */
  inversionStockMora: 'rda/sectorista/brecha/brecha_inversion_sec_01',
  /** Monitor de Efectividades — paginado. */
  monitorEfectividades: 'RS_MON_EFEC_SEC_01',
  /** Plan de Datos. */
  planDatos: 'P_Datos_02',
  /** Prospecto Corresponsal — listado. */
  prospectoCorresponsal: 'LIS_PROSPE_01',
  /** Prospecto Corresponsal — catálogo de jerarquías. */
  prospectoCorresponsalJerarquias: 'SEL_JER_01',
  /** Prospecto Corresponsal — alta (`postRegularUpdate`). */
  prospectoCorresponsalGuardar: 'ADD_PROS_CORRE_01',
  /** Recuperación Preventiva. */
  recuperacionPreventiva: 'rda/sectorista/recuperacion_preventiva/recuperacion_preventiva_01',
  /** Resumen de Movilidad. */
  resumenMovilidad: 'RESNMOV_02',
  /** Seguros. */
  seguros: 'rda/sectorista/seguros/seguros_sec_01',
} as const;

/** Reportes de varios bloques, en el orden en que el service los expone. */
export const COD_ANALISTA_MULTIBLOQUE = {
  /** Captaciones. */
  captaciones: [
    'rda/sectorista/captaciones/captacion_sec_01',
    'rda/sectorista/captaciones/captacion_sec_02',
    'rda/sectorista/captaciones/captacion_sec_03',
  ],
  /** Cartera. */
  cartera: ['rda/sectorista/cartera/cartera_sec_01', 'rda/sectorista/cartera/cartera_sec_02'],
  /** Clientes por Producto. */
  clientesProducto: [
    'rda/sectorista/cliente_producto/cliente_producto_sec_01',
    'rda/sectorista/cliente_producto/cliente_producto_sec_02',
    'rda/sectorista/cliente_producto/cliente_producto_sec_03',
  ],
  /** Colocaciones Diarias. */
  colocacionesDiaria: ['PROYEC_DIACOLREC_AS_01', 'PROYEC_DIACOLREC_AS_02', 'PROYEC_DIACOLREC_AS_03'],
  /** Monitor de Metas de Desembolso — los dos primeros llevan `tipmet: 1`. */
  monitorMetasDesembolso: [
    'rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_01',
    'rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_02',
    'rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_03',
  ],
  /** Planilla de Movilidad — cada bloque tolera su propia falla. */
  planillaMovilidad: ['PLANMOV_01', 'PLANMOV_02', 'PLANMOV_03', 'PLANMOV_04'],
} as const;

/**
 * Autonomía de Tasas: cuatro bloques del mismo reporte, cada uno con su `var`
 * fijo — y el `var` NO sigue el orden de los bloques.
 */
export const BLOQUES_AUTONOMIA_TASAS_ANALISTA = [
  { codRep: 'rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec_01', var: '4' },
  { codRep: 'rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec_02', var: '1' },
  { codRep: 'rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec_03', var: '3' },
  { codRep: 'rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec_04', var: '2' },
] as const;

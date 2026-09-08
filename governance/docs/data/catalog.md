# Catálogo de datos

Qué datos consume el MIS Host, de dónde salen y quién responde por ellos.

## Dominios

Cada dominio agrupa los datos de un área de negocio. El **custodio técnico** es quien mantiene el código que los consume; el **propietario funcional** es quien define qué significa la cifra y puede corregirla — y está pendiente de confirmar con negocio, no se inventa acá.

| Dominio | Fuente (backend Ant) | Servicio de acceso | Propietario funcional |
|---|---|---|---|
| Actividades | `app` (6302) | `ActividadesService` | Por confirmar |
| Analista | `reporting` (5304) | servicios de módulo y de reportes | Por confirmar |
| Categorización | `app` (6302) | `CategorizacionService` | Por confirmar |
| Dashboards (Power BI) | `app` (6302) | `DashboardService` | Por confirmar |
| ESG | `app` (6302) | `FrameworkEsgService` | Por confirmar |
| Herramientas (base negativa) | `reporting` (5304) | `BaseNegativaService` | Por confirmar |
| Incentivos | `app` (6302) | `IncentivosService` | Por confirmar |
| Kaypacha / Ranking | `app` (6302) | `KaypachaService` | Por confirmar |
| Presupuesto | `app` (6302) | `PresupuestoService` | Por confirmar |
| Reportes | `reporting` (5304), `6304` | `ModReportesService`, `ModRep2Service` | Por confirmar |
| Jerarquía organizativa | `admin` (6301) | `ModSysAdminService` | Por confirmar |
| Identidad y sesión | `session` (6300) | `ModSysLoginService` | Por confirmar |
| Menú y secciones | `5301` | `ModSeccionesService` | Por confirmar |

Los puertos y `appId` de cada módulo están en [transporte Winder](./contracts/winder-transport.md). El alcance funcional de cada dominio, en [catálogo de dominios de negocio](../business/domain-catalog.md).

> **Las columnas "por confirmar" son la brecha principal de este catálogo.** Sin propietario funcional, una cifra dudosa no tiene a quién escalarse y la corrección queda en manos de quien tocó el código último. Está registrado como prioridad en el [roadmap](../business/roadmap.md) y en [responsabilidades](./stewardship.md).

## Inventario de códigos de reporte

Cada `cod_rep` identifica una consulta del backend: es el activo de datos más concreto del sistema. La tabla se deriva de los archivos `constantes/*.constantes.ts`.

**No editar a mano**: `npm run inventario` regenera, `npm run inventario:check` verifica en CI.

<!-- generado:inicio cod-rep -->
<!-- Generado por governance/scripts/generar-inventario.mjs — 2026-09-08 · commit bf91deb. No editar a mano. -->

| Dominio | Constante | Códigos | `cod_rep` declarados |
|---|---|---:|---|
| reportes / analista | `COD_ANALISTA` | 25 | `LST_AUT_01`, `rda/sectorista/campania_agil/campana_agil_sec_01`, `rda/sectorista/canal_alt/canal_alt_sec_01`, `rda/sectorista/cero_cuota/cero_cuota_sec_01`, `rda/sectorista/clientes_nuevos_recurrente/cliente_nuevo_rec_01`, `rda/sectorista/cli_pot/cli_pot_sec_01`, `RES_SEC_REP_01`, `UP_REPRO_01`, `DET_CLI_01`, `SEL_CIU_01`, `UPD_CLI_01`, `DESE_SOC_AS_01`, `LIS_CAPRET_01`, `SEL_CIU_02`, `UPD_CAPRET_01`, `rda/sectorista/grupo_pdm/grupo_pdm_sec_01`, `rda/sectorista/brecha/brecha_inversion_sec_01`, `RS_MON_EFEC_SEC_01`, `P_Datos_02`, `LIS_PROSPE_01`, `SEL_JER_01`, `ADD_PROS_CORRE_01`, `rda/sectorista/recuperacion_preventiva/recuperacion_preventiva_01`, `RESNMOV_02`, `rda/sectorista/seguros/seguros_sec_01` |
| reportes / analista | `COD_ANALISTA_MULTIBLOQUE` | 18 | `rda/sectorista/captaciones/captacion_sec_01`, `rda/sectorista/captaciones/captacion_sec_02`, `rda/sectorista/captaciones/captacion_sec_03`, `rda/sectorista/cartera/cartera_sec_01`, `rda/sectorista/cartera/cartera_sec_02`, `rda/sectorista/cliente_producto/cliente_producto_sec_01`, `rda/sectorista/cliente_producto/cliente_producto_sec_02`, `rda/sectorista/cliente_producto/cliente_producto_sec_03`, `PROYEC_DIACOLREC_AS_01`, `PROYEC_DIACOLREC_AS_02`, `PROYEC_DIACOLREC_AS_03`, `rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_01`, `rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_02`, `rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_03`, `PLANMOV_01`, `PLANMOV_02`, `PLANMOV_03`, `PLANMOV_04` |
| reportes / actividad-diaria / Aplicativo Movil | `COD_APLICATIVO_MOVIL` | 1 | `APP_USO_01` |
| reportes / avance-comercial | `COD_AVANCE_COMERCIAL` | 5 | `Monitor_Dese_01`, `Monitor_Dese_02`, `Monitor_Dese_03`, `Monitor_Dese_04`, `RS_MON_REP_01` |
| reportes / actividad-diaria / Cartera en Mora | `COD_BASE_GESTION` | 1 | `LCCUOTANUEVA_01` |
| herramientas | `COD_BASE_NEGATIVA` | 1 | `RS_BASE_NEG_01` |
| reportes / actividad-diaria / Campañas | `COD_CAMPANAS` | 6 | `R_APADRINA_01`, `SEL_JER_MENTORING_01`, `RMENTORIN_01`, `RS_AGE_COM_01`, `RS_AGE_COM_02`, `RS_AGE_COM_03` |
| reportes / actividad-diaria / Captaciones | `COD_CAPTACIONES` | 12 | `CARACT_CARTERA_01`, `CARACT_pas_01`, `rda/administracion/captaciones/captacion_canal_01`, `GCMGCAP_01`, `CMG_CLI_PAS_01`, `CMG_CLI_PAS_STOCK_02`, `CMG_CLI_PAS_DETA_01`, `RS_CARTEPAS_01`, `RECSERV_PAS_01`, `CAP_SEGUI_BP_01`, `CAP_SEGUI_FC_BP_01`, `RS_MON_SALCAP_COM_01` |
| reportes / actividad-diaria / Cartera | `COD_CARTERA_CRA` | 8 | `PortafolioAgro_01`, `DESCRED_01`, `GCOMCRE_02`, `reporte_autonomia_newdiaria_01`, `RACTGP_01`, `RESMORAGP_01`, `RESINCGRUP_01`, `DET_INCEN_PDM_01` |
| reportes / actividad-diaria / Cartera | `COD_CARTERA_CRA_MULTIBLOQUE` | 14 | `RS_SAL_CAR_04`, `RS_SAL_CAR_05`, `RS_SAL_CAR_01`, `RS_SAL_CAR_02`, `RS_SAL_CAR_03`, `RS_DAT_PRO_01`, `RS_DAT_PRO_02`, `RS_DAT_PRO_03`, `RS_DAT_PRO_04`, `DesemDiario_01`, `DesemDiario_02`, `DesemDiario_03`, `DesemDiario_04`, `DesemDiario_05` |
| reportes / actividad-diaria / Cartera en Mora | `COD_CARTERA_MORA` | 11 | `cuadro_Variable_Riesgo_01`, `cmg_mora_simp_01`, `RS_MON_EFEC_01`, `RS_MON_EFEC_02`, `RS_MON_EFEC_03`, `SEL_EFEC_01`, `RS_MON_EFECREPRO_01`, `RS_MON_EFECTRAMOSC_01`, `RMESA_01`, `RSRTOPV01`, `RS_AVA_POR_01` |
| reportes / actividad-diaria / Cartera en Mora | `COD_CARTERA_MORA_PAREJAS` | 6 | `RS_CAL_CAR_01`, `RS_CAL_CAR_02`, `PORTSUPE_01`, `PORTSUPE_02`, `CEROYCUOTA_01`, `CEROYCUOTA_02` |
| reportes / actividad-diaria / Cartera | `COD_CARTERA_REPO` | 10 | `RS_DESEMB_01`, `RS_AGROMIX_01`, `RS_GEST_COM_01`, `RS_GEST_COM_02`, `RS_GEST_COM_03`, `CMG_CARTERA_01`, `CMG_CARTERA_02`, `RS_RANK_COM_01`, `RS_MON_INT_COM_01`, `RS_FECH02` |
| reportes / actividad-diaria / Cartera en Mora | `COD_CERO_CUOTAS` | 8 | `rda/administracion/mora/Dashboard_rda_01`, `CMCUONUEV_01`, `CMCUONUEV_02`, `CEROCUOTA_TOPCNUEVA_01`, `CEROCUOTA_TOPCNUEVA_02`, `CEROCUOTA_TOPCNUEVA_03`, `CEROCUOTA_TOPCNUEVA_04`, `CEROCUOTA_TOPCNUEVA_05` |
| reportes / actividad-diaria / Clientes | `COD_CLIENTES` | 7 | `Clientes_nuevoRec_01`, `Clientes_Ope_01`, `CMG_CLIF_01`, `rda/administracion/clientes/cmg_cliente_01`, `MOVIMIENTO_CLIENTES_01`, `RS_RANK_MUJ_01`, `RS_RANK_MUJ_02` |
| reportes / actividad-diaria / Comercial Ejecutivo | `COD_COMERCIAL_EJECUTIVO` | 4 | `DESEMBOLSOS_01`, `Clientes_01`, `AGRO_01`, `PDM_01` |
| reportes / control-cargas | `COD_CONTROL_CARGAS` | 1 | `RS_MON_CAR_01` |
| reportes / desarrollo-sostenible | `COD_DESARROLLO_SOSTENIBLE` | 3 | `Monitor_Dese_misi_02`, `Monitor_Dese_misi_01`, `DESEMP_SOC_01` |
| reportes / actividad-mensual | `COD_MENSUAL_CRA` | 17 | `P_Datos_01`, `HCARBONO_01`, `GCMGCAP_01`, `CAP_SEGUI_BP_01`, `CARACT_CARTERA_M_01`, `CARACT_pas_M_01`, `reporte_autonomia_new_01`, `SEGUI_COMITE_01`, `cuadro_Variable_M_01`, `cmg_mora_simp_m_01`, `COSESEMAFORO_01`, `DESEMP_SOC_01`, `CMG_CLIF_01`, `resultado_unidad_negocio_rma_01`, `rankKay_01`, `rankKayOpe_01`, `rankKayrecu_01` |
| reportes / actividad-mensual | `COD_MENSUAL_DEPRECADO` | 7 | `rma/administracion/Cartera/cartera_producto_rma_02`, `rma/administracion/Cartera/cartera_producto_rma_01`, `rma/administracion/Cartera/tasa_producto_rma_01`, `rma/administracion/Riesgos/grafico_cosechas_01`, `rma/administracion/Mora/mora_efectividad_tramos_rma_01`, `rma/administracion/mora/Dashboard_rma_01`, `rma/administracion/Clientes/cmg_clientes_rma_01` |
| reportes / actividad-mensual | `COD_MENSUAL_MULTIBLOQUE` | 15 | `RS_AGE_COM_CRM_F_01`, `RS_AGE_COM_CRM_F_02`, `RS_AGE_COM_CRM_S_03`, `RS_AGE_COM_CRM_S_04`, `RS_DAT_PRO_01`, `RS_DAT_PRO_02`, `RS_DAT_PRO_03`, `RS_DAT_PRO_04`, `CONT_ELECT_M_01`, `CONT_ELECT_M_02`, `CONT_ELECT_M_03`, `RS_MON_EFECREASIGM_01`, `RS_MON_EFECREASIGM_02`, `RS_AGE_COM_CRM_01`, `RS_AGE_COM_CRM_02` |
| reportes / actividad-mensual | `COD_MENSUAL_REPO` | 6 | `RS_FECH`, `RS_TAB_COM_01`, `RS_DESEMB_02`, `RS_AGROMIX_01`, `CMG_CARTERA_01`, `CMG_CARTERA_02` |
| reportes / actividad-diaria / Portafolio Reasignado | `COD_PORTAFOLIO_REASIGNADO` | 6 | `RS_MON_EFECREASIG_03`, `RS_AGE_COM_CR_01`, `RS_AGE_COM_CR_03`, `RS_MON_EFECREASIG_01`, `RS_MON_EFECREASIG_02`, `SEL_EFEC_01` |
| reportes / actividad-diaria / Proyecciones | `COD_PROYECCIONES` | 4 | `PROYEC_COLREC_01`, `PROYEC_COLREC_03`, `PROYEC_DIACOLREC_01`, `PROYEC_DIACOLREC_02` |
| reportes / actividad-diaria / Reportes PDM | `COD_REPORTES_PDM` | 2 | `SEG_PDM_01`, `GRBSOLI_01` |
| reportes / actividad-diaria | `COD_RESUMEN_MOVILIDAD` | 2 | `RESNMOV_01`, `RESNMOVR_01` |
| reportes / actividad-diaria / Seguros | `COD_SEGUROS` | 12 | `GRSCMIS_01`, `GRSCMIS_02`, `GRSCMIS_04`, `GRSCMIS_05`, `RS_SEG_PAS_03`, `RS_SEG_PAS_01`, `RS_SEG_PAS_02`, `RS_SEG_PAS_04`, `GRSCMISREP_01`, `RS_FECH`, `GRAFSEGPAS_01`, `GRAFSEGPAS_02` |
| reportes / actividad-diaria / Tablero Digital | `COD_TABLERO_DIGITAL` | 9 | `TABDIG_01`, `TABDIG_02`, `TABDIG_VR2_01`, `GCTABDIG_VR2_OPE_02`, `RVIUWGCOR_01`, `RVIUWGCORE_02`, `RDETCORR_01`, `RS_FECH`, `RS_TAB_COM_01` |

_206 códigos únicos en 28 constantes._
<!-- generado:fin -->

### Cómo leer esta tabla

- **Dominio**: módulo y, dentro de `reportes`, el subdominio y la agrupación.
- **Constante**: el símbolo TypeScript que declara los códigos. Es lo que se importa; el literal nunca se escribe suelto en un servicio.
- **`cod_rep` declarados**: los códigos que el backend reconoce.

Un código con prefijo `rda/` es un strand del motor legado `reportData`, conservado solo por compatibilidad.

### Lo que esta tabla no dice

Es un inventario de **códigos declarados**, no un catálogo semántico completo. Para cada código faltan aún, y deben completarse en la [ficha de reporte](../templates/report-spec-template.md) al tocarlo:

- qué mide la cifra y en qué unidad;
- qué motor la procesa (`regularData`, `table.regular`, `graphicData`, `reportData`);
- qué nivel de jerarquía admite y con qué formato de fecha;
- qué significa una respuesta vacía en ese código concreto.

Esa ficha es el mecanismo por el que el catálogo se completa de forma incremental, un reporte por vez, en lugar de un censo que envejecería antes de terminarse.

## Datos que no vienen del backend

No todo dato del sistema llega por Winder. Estos se originan en el cliente y tienen su propio régimen:

| Dato | Origen | Almacenamiento | Nota |
|---|---|---|---|
| Preferencias de interfaz | elección del usuario | `localStorage`, clave única saneada | No transportan autorización |
| Reportes recientes | navegación del usuario | dentro de preferencias | Traza de uso, no dato de negocio |
| Sesión e identidad activa | login contra Ant | `sessionStorage` | Se limpia al cerrar sesión |
| Caché de jerarquía | respuesta de `admin` | `sessionStorage`, prefijo `mis.jerarquia.` | Debe invalidarse al cambiar de usuario |

El caché de jerarquía es el más delicado: si su clave no incluye identidad, nodo y fecha de corte, un usuario alterno puede ver el árbol del usuario anterior. Ver [clasificación](./classification.md) y [linaje](./lineage.md).

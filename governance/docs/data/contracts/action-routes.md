# Rutas de acción del backend Ant

Qué le pide exactamente el frontend al backend, con qué parámetros y bajo qué clave espera la respuesta.

El [catálogo de datos](../catalog.md) responde *qué reportes se consultan* (`cod_rep`). Este documento responde la otra mitad: **la superficie completa de llamadas**. Sin él, "qué consume el MIS Host" solo se podía contestar abriendo los diez servicios de `src/app/core/winder/instances/` uno por uno.

## Cómo leer la tabla

Cada fila es una llamada real que existe en el código.

| Columna | Qué es |
|---|---|
| **Módulo Ant** | `appId` y puerto del módulo del backend — ver [transporte Winder](./winder-transport.md) |
| **Servicio** | la clase de `core/winder/instances/` que la emite |
| **Método** | el método público que la expone al resto de la aplicación |
| **Ruta de acción** | el `strand`: el nombre de la operación en Ant (`incentivos3.lista3`, `base_hier`, `list_pick_01`) |
| **Verbo** | `GET` para consulta, `POST` para escritura |
| **Parámetros de payload** | las claves que viajan cifradas en la petición |
| **Clave de respuesta** | bajo qué nombre viene el cuerpo útil (`resultado`, `list_res`, `menu_response`…) |

Los nombres son los del backend y **no se traducen**: `tip_cod` no se convierte en `tipoCodigo` en el borde. Ver [glosario](../glossary.md).

## Qué mirar en esta tabla

- **Las escrituras.** Un `POST` es el único punto donde este frontend modifica algo en el origen. Son pocos y conviene saber cuáles.
- **La fecha de corte.** Una consulta con alcance temporal que no lleve `fec` está tomando el período por defecto del backend, no el que el usuario ve en pantalla.
- **La jerarquía.** `tip_cod` y `cod_rel` juntos delimitan el nodo organizativo. Una consulta de negocio sin ellos devuelve el alcance completo del usuario, que rara vez es lo que la pantalla quiere mostrar.
- **Rutas huérfanas.** Un método que ya nadie llama sigue apareciendo acá: es superficie de contrato que se mantiene sin consumidor.

## Inventario

**No editar a mano**: `npm run inventario` regenera, `npm run inventario:check` verifica en CI.

<!-- generado:inicio rutas-de-accion -->
<!-- Generado por governance/scripts/generar-inventario.mjs — 2026-09-10 · commit c3f5393. No editar a mano. -->

| Módulo Ant | Servicio | Método | Ruta de acción | Verbo | Parámetros de payload | Clave de respuesta |
|---|---|---|---|---|---|---|
| `app` (6302) | `ModDashboardService` | `postObjectUsers` | `reportes2.guardar` | POST | `json` | `response` |
| `app` (6302) | `ModDashboardService` | `getObjectList` | `reportes2.lista` | GET | `cod_bt`, `is_admin` | `resultado` |
| `app` (6302) | `ModDashboardService` | `getPowerBIReportToken` | `reportes2.pbi_rtoken` | GET | `report_id`, `dataset_id` | `resultado` |
| `app` (6302) | `ModDashboardService` | `getObjectUsers` | `reportes2.usuarios` | GET | `report_id` | `resultado` |
| `app` (6302) | `ModFrameworkEsgService` | `postActualizaMet` | `esg.act_met` | POST | `cod_bt`, `cod_met`, `cfg` | `response` |
| `app` (6302) | `ModFrameworkEsgService` | `getConfiguracionMod` | `esg.cfg_mod` | GET | `cod_bt` | `resultado` |
| `app` (6302) | `ModFrameworkEsgService` | `getMetUsers` | `esg.get_users` | GET | `cod_met` | `resultado` |
| `app` (6302) | `ModFrameworkEsgService` | `postMetUsers` | `esg.post_users` | POST | `json` | `response` |
| `app` (6302) | `ModFrameworkEsgService` | `getResumenCat` | `esg.res_cat` | GET | `cod_cat`, `cod_bt`, `is_admin` | `resultado` |
| `app` (6302) | `ModFrameworkEsgService` | `getResumenPor` | `esg.res_por` | GET | — | `resultado` |
| `app` (6302) | `ModIncentivosService` | `getCliBanc` | `incentivos3.bancarizados3` | GET | `tip_cod`, `cod_rel`, `fec` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `getDetail` | `incentivos3.detalle_var3` | GET | `tip_cod`, `cod_rel`, `cod_var`, `fec` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `getFromHierList` | `incentivos3.lista3` | GET | `tip_cod`, `cod_rel`, `tip_cod_l` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `getProd` | `incentivos3.productividad3` | GET | `tip_cod`, `cod_rel`, `fec` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `getTasa` | `incentivos3.tasas3` | GET | `tip_cod`, `cod_rel`, `fec` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `calcularIndividual` | `incentivos4.calculadora4` | GET | `model`, `params`, `fec` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `calcularGrupal` | `incentivos4.calculadora5` | GET | `params`, `fec` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `getDataSourcesIndividual` | `incentivos4.resultados4` | GET | `model`, `tip_cod`, `cod_rel`, `fec` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `getDataSourcesGrupal` | `incentivos4.resultados5` | GET | `tip_cod`, `cod_rel`, `fec` | `resultado` |
| `app` (6302) | `ModIncentivosService` | `getRetencion` | `incentivos4.retencion4` | GET | `tip_cod`, `cod_rel`, `fec` | `resultado` |
| `app` (6302) | `ModKaypachaService` | `getUserLists` | `kaypacha.colaboradores` | GET | — | `resultado` |
| `app` (6302) | `ModKaypachaService` | `getColaboradoresData` | `kaypacha.colaboradoresData` | GET | `cod_bt` | `resultado` |
| `app` (6302) | `ModKaypachaService` | `getDetalleRanking` | `kaypacha.DetalleRanking` | GET | `cod_bt` | `resultado` |
| `app` (6302) | `ModKaypachaService` | `getListRanking` | `kaypacha.listRanking` | GET | `cod_bt` | `resultado` |
| `app` (6302) | `ModPresupuestoService` | `getResCarCreditos` | `presupuesto.get_car_cre` | GET | `email`, `tip_cod`, `cod_rel` | `resumen` |
| `app` (6302) | `ModPresupuestoService` | `getResDepBP` | `presupuesto.get_dep_bp` | GET | `email`, `tip_cod`, `cod_rel` | `resumen` |
| `app` (6302) | `ModPresupuestoService` | `getResDepRed` | `presupuesto.get_dep_red` | GET | `email`, `tip_cod`, `cod_rel` | `resumen` |
| `app` (6302) | `ModPresupuestoService` | `getLogVerificaciones` | `presupuesto.get_log_ver` | GET | `tip_cod`, `cod_sec` | `resultado` |
| `app` (6302) | `ModPresupuestoService` | `getRegResultados` | `presupuesto.get_reg_res` | GET | `tip_cod` | `resultado` |
| `app` (6302) | `ModPresupuestoService` | `getResSegComercial` | `presupuesto.get_seg_com` | GET | `email`, `tip_cod`, `cod_rel` | `resumen` |
| `app` (6302) | `ModPresupuestoService` | `getResSegOperaciones` | `presupuesto.get_seg_ope` | GET | `email`, `tip_cod`, `cod_rel` | `resumen` |
| `app` (6302) | `ModPresupuestoService` | `postResCarCreditos` | `presupuesto.post_car_cre` | POST | `cod_bt`, `tip_cod`, `cod_rel`, `ov_json` | `response` |
| `app` (6302) | `ModPresupuestoService` | `postResDepBP` | `presupuesto.post_dep_bp` | POST | `cod_bt`, `tip_cod`, `cod_rel`, `ov_json` | `response` |
| `app` (6302) | `ModPresupuestoService` | `postResDepRed` | `presupuesto.post_dep_red` | POST | `cod_bt`, `tip_cod`, `cod_rel`, `ov_json` | `response` |
| `app` (6302) | `ModPresupuestoService` | `postLogVerificaciones` | `presupuesto.post_log_ver` | POST | `cod_bt`, `tip_cod`, `cod_rel`, `cod_sec` | `response` |
| `app` (6302) | `ModPresupuestoService` | `postRegResultados` | `presupuesto.post_reg_res` | POST | `cod_bt`, `ov_json` | `response` |
| `app` (6302) | `ModPresupuestoService` | `postResSegComercial` | `presupuesto.post_seg_com` | POST | `cod_bt`, `tip_cod`, `cod_rel`, `ov_json` | `response` |
| `app` (6302) | `ModPresupuestoService` | `postResSegOperaciones` | `presupuesto.post_seg_ope` | POST | `cod_bt`, `tip_cod`, `cod_rel`, `ov_json` | `response` |
| `rep2` (6304) | `ModRep2Service` | `getMonImrDetalle` | `mon_imr.detalle` | GET | — | `response` |
| `rep2` (6304) | `ModRep2Service` | `getMonImrResultados` | `mon_imr.resultados` | GET | — | `response` |
| `rep2` (6304) | `ModRep2Service` | `getMonSalidasDetalle` | `mon_sali_ret.detalle` | GET | — | `response` |
| `rep2` (6304) | `ModRep2Service` | `getMonSalidasResultados` | `mon_sali_ret.resultados` | GET | — | `response` |
| `reporting` (5304) | `ModReportesService` | `getGraphicData` | `graphicData` | GET | `cod_rep` | `result` |
| `reporting` (5304) | `ModReportesService` | `getRegularData` | `regularData` | GET | `cod_rep` | `result` |
| `reporting` (5304) | `ModReportesService` | `getDeprecatedData` | `reportData` | GET | `cod_rep` | `result` |
| `reporting` (5304) | `ModReportesService` | `getRegularTableResult` | `table.regular` | GET | `cod_rep` | `resultado` |
| `secciones` (5301) | `ModSeccionesService` | `getDetalleCategorizacion` | `categorizacion.detalle` | GET | `cod_bt` | `resultado` |
| `secciones` (5301) | `ModSeccionesService` | `getDetalleCliente` | `dashboard.cliente` | GET | `cod_bt`, `num_doc`, `tip_doc`, `pais` | `resultado` |
| `secciones` (5301) | `ModSeccionesService` | `getHistoricoVariable` | `dashboard.historico` | GET | `cod_bt`, `cod_var` | `resultado` |
| `secciones` (5301) | `ModSeccionesService` | `getResumenDashboard` | `dashboard.resumen` | GET | `cod_bt` | `resultado` |
| `secciones` (5301) | `ModSeccionesService` | `postProsBecas` | `listas.post_becas` | POST | `cod_bt`, `num_doc`, `com` | `response` |
| `secciones` (5301) | `ModSeccionesService` | `getListaPrioLeads` | `listas.prio_leads` | GET | `cod_bt` | `resultado` |
| `secciones` (5301) | `ModSeccionesService` | `getListaBecas` | `listas.pro_becas` | GET | `cod_bt` | `resultado` |
| `secciones` (5301) | `ModSeccionesService` | `postRegularUpdate` | `regularUpdate` | GET | `cod_rep` | `result` |
| `secciones` (5301) | `ModSeccionesService` | `getSecList` | `sec_list2` | GET | `email` | `result_sectorista` |
| `admin` (6301) | `ModSysAdminService` | `getBaseHierarchy` | `base_hier` | GET | `email`, `cod_jer` | `base_hierarchy` |
| `admin` (6301) | `ModSysAdminService` | `getLevelHierarchy` | `level_hier` | GET | `cod_jer`, `lvl_jer`, `tip_cod`, `cod_rels`, `params` | `level_hierarchy` |
| `admin` (6301) | `ModSysAdminService` | `getListPick01` | `list_pick_01` | GET | `tip_cod`, `cod_rel` | `list_res` |
| `admin` (6301) | `ModSysAdminService` | `getMenuItems` | `list_sec` | GET | `email` | `menu_response` |
| `admin` (6301) | `ModSysAdminService` | `postRouteTrack` | `reg_track_info` | POST | `reg_json` | `res` |
| `session` (6300) | `ModSysLoginService` | `login` | `login` | POST | `email`, `alt` | `login_response` |
| `session` (6300) | `ModSysLoginService` | `altLogin` | `login` | POST | `email`, `alt` | `login_response` |
| `session` (6300) | `ModSysLoginService` | `postMeta` | `meta` | POST | `email`, `meta` | `response` |

_62 rutas de acción únicas en 10 servicios de `core/winder/instances/`._
<!-- generado:fin -->

## Límites

- Se derivan del código del frontend, así que describen **lo que se pide**, no lo que el backend puede responder. Un parámetro opcional que ningún método usa hoy no aparece.
- Los tipos y la forma de la respuesta no están acá: viven en los modelos de cada módulo y en la [ficha de reporte](../../templates/report-spec-template.md).
- Las llamadas que arman su `Strand` con lógica condicional se listan con los parámetros que el código empuja de forma literal.

## Ver también

- [Transporte Winder](./winder-transport.md) — cómo viaja y se cifra cada una de estas llamadas
- [Catálogo de datos](../catalog.md) — dominios y `cod_rep`
- [Contratos de reporte](./reporting-contracts.md) — los motores que procesan las consultas de reporte
- [Modelo de acceso](./access-model.md) — quién puede pedir qué

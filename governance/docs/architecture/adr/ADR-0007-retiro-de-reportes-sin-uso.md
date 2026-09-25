# ADR-0007: Retiro de reportes y módulos sin uso

- Estado: Vigente
- Fecha: 2026-09-23
- Responsables: Frontend MIS Host

## Contexto

El menú legacy entregó una lista de pantallas que quedan inutilizadas, algunas marcadas `DESHABILITADO`. Mantenerlas migradas tiene costo real: specs, E2E, `cod_rep` en el catálogo, entradas en la línea base y superficie de revisión. Además dejan rutas que parecen vivas.

## Decisión

Se retiran del frontend, con su ruta, componente, métodos de servicio que solo ellas usaban, `cod_rep` y pruebas.

| Grupo | Retirado |
|---|---|
| Módulo `analista` completo | Principal, Listas, Becas, Priorización de Leads (`/app/analista`) |
| Módulo `presupuesto` completo | Cartera Créditos, Depósitos Red, Depósitos BP, Seguros Comercial, Seguros Operaciones, Responsables, Tablero Verificación |
| Reportes Analista (`rda/sec`) | Encuesta Clientes, Clientes Reprogramados, Campaña Ágil, Datos Clientes, Canal Alternativo, Clientes Potenciales, Plan de Datos, Autonomías |
| Actividad Diaria | CMG Clientes Stock, CMG Clientes Flujo Detalle, Detalle Corresponsales, Efectividad de Cartera Reasignada, Gestión por Canal, Dashboard en Revisión, Evolutivo Pasivos, Ranking Clientes, Monitor IMR |
| Actividad Mensual | Gestión de Cartera Stock, Seguimiento BP, Desempeño Social, Comité de Créditos, ~~Gestión de Cartera Reasignada Mes~~ (restituida, ver abajo) |
| Desarrollo Sostenible | Poblaciones Misionales |

Límites de la decisión:

- **Se conserva el transporte Winder** (`core/winder/instances/`), aunque algunos métodos queden sin llamadas (p. ej. `ModPresupuestoService` y los `getMonImr*` de `ModRep2Service`). La restricción vigente congela Winder. El inventario de rutas de acción marca esos métodos con **0** llamadas para decidir su retiro aparte.
- **Se conserva** `/app/reportes/leg/com/rda/adm/gest_cart_her` (versión diaria). Solo se retiró la mensual (`rma/adm/gest_cart_her`).
- **Enmienda (2026-09-25):** negocio volvió a pedir la mensual *Gestión de Cartera Reasignada Mes* (menú *Actividad Mensual > Cartera en Mora*). Se restituyó `/app/reportes/leg/com/rma/adm/gest_cart_her` (`RS_AGE_COM_CRM`, host `cra-v11`), compartiendo componente con `gest_cart_her-flujo` (`RS_AGE_COM_CRM_F`); la ruta elige el reporte con `data.reporte`.
- **No requirieron cambios** las pantallas de la lista sin implementación en este repositorio: Corresponsal, Prospectos Corresponsal, Reasignación Cartera Capt, Usuarios, Rutas y Usabilidad.

## Consecuencias

- **Menos superficie:** reportes, códigos y pruebas que ya no protegían nada.
- **Módulo huérfano:** `prospecto` solo se enlazaba desde el módulo `analista` retirado. La regla `modulo-enrutado` lo señala hasta que se enlace o se retire.
- **Sin vuelta automática:** una URL retirada termina en Not Found o en el explorador (comodín `**`). Si el menú STG sigue entregándola, hay que quitarla del menú en backend.
- **Nuevos controles de gobernanza:** `modulo-enrutado`, `e2e-rutas-vigentes` y `linea-base-vigente` evitan que un retiro deje restos. Al estrenarse encontraron una URL mal escrita en `e2e/jerarquia-cache.spec.ts` y una clave de línea base de un archivo inexistente.

## Evidencia

- **Procedimiento:** [guía de retiro](../../development/report-retirement-guide.md).
- **Inventarios regenerados:** [módulos](../module-inventory.md), [catálogo `cod_rep`](../../data/catalog.md), [rutas de acción](../../data/contracts/action-routes.md).
- **Verificación al cierre:**
  - build de producción y `npm run verify` sin errores;
  - 331 archivos y 1793 pruebas unitarias en verde;
  - E2E: 478 pasan al cerrar el retiro. Los 27 fallos restantes ya ocurrían en el commit `b4af615`: se clasificaron y corrigieron después en INC-2026-09-23-02 ([incidentes](../../evidence/quality/incidents.md)). Hoy la suite completa pasa: 507 en verde, 1 omitido a propósito.

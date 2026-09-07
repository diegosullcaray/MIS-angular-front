# Contratos API y gobierno de datos

Este directorio es la entrada canonica para contratos entre MIS Host y backend. El transporte actual usa Winder/Ant; no es REST convencional.

## Contratos vigentes

| Contrato | Responsabilidad | Documento |
|---|---|---|
| Winder | Transporte cifrado, `Strand`, `IWinderResponse` y rutas `v1/g`, `v1/p`, `v1/pf` | [System overview](../system-overview.md) |
| Reportes | `regularData`, `table.regular`, `graphicData`, `reportData` | [Reporting contracts](../reporting-contracts.md) |
| Jerarquia | `cod_jer`, `tip_cod`, `cod_rel`, niveles y fecha de corte | [Organizational hierarchy](../organizational-hierarchy.md) |
| Navegacion y permisos | Arbol, roles, herencia, ALLOW/DENY y sesiones | [Modelo de accesos](./access-model.md) |

El recorrido tecnico completo esta en [data flow](../data-flow.md). Los endpoints Winder no deben documentarse como REST generico: cada servicio fija `appId`, puerto logico, strand, nombre de respuesta y forma de payload.

## Reglas de gobierno

1. Cada contrato identifica propietario, consumidor, version, campos obligatorios y errores conocidos.
2. Los nombres del backend se conservan en el borde; el dominio puede mapearlos a tipos explicitos.
3. Un cambio incompatible requiere ADR, prueba de contrato y plan de migracion.
4. Ningun contrato del frontend sustituye la autorizacion del backend.

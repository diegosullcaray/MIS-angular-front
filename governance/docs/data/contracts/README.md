# Contratos de datos

Entrada canónica para los contratos entre MIS Host y el backend. **El transporte no es REST convencional**: usa Winder/Ant, con strands en vez de recursos.

## Contratos vigentes

| Contrato | Qué define | Documento |
|---|---|---|
| Transporte | `Strand`, `Winder-Params`, parámetro `w` cifrado, `IWinderResponse`, rutas `v1/g`, `v1/p`, `v1/pf` | [Winder / Ant](./winder-transport.md) |
| Reportes | los cuatro motores: `regularData`, `table.regular`, `graphicData`, `reportData` | [Motores de reporte](./reporting-contracts.md) |
| Jerarquía | `cod_jer`, `tip_cod`, `cod_rel`, niveles y fecha de corte | [Jerarquía organizativa](./organizational-hierarchy.md) |
| Navegación y permisos | árbol, roles, herencia, ALLOW/DENY y sesiones | [Modelo de acceso](./access-model.md) |

Los endpoints Winder no se documentan como REST genérico: cada servicio fija `appId`, puerto lógico, strand, nombre de respuesta y forma de payload. El recorrido técnico completo está en [flujo de datos](../../architecture/data-flow.md) y en [linaje](../lineage.md).

## Reglas de gobierno

1. Cada contrato identifica **propietario, consumidor, versión, campos obligatorios y errores conocidos**.
2. Los nombres del backend se conservan en el borde; el dominio puede mapearlos a tipos explícitos, y ese mapeo queda documentado.
3. Un cambio incompatible requiere ADR, prueba de contrato y plan de migración.
4. Ningún contrato del frontend sustituye la autorización del backend.
5. Un contrato retirado se elimina del código **y del [catálogo](../catalog.md)**: documentar algo que ya no existe es peor que no documentarlo.

## Al agregar un contrato

Completar la [ficha de reporte](../../templates/report-spec-template.md), que obliga a resolver antes de escribir código: `cod_rep`, motor, servicio `Mod*`, parámetros fijos y de filtro, nivel de jerarquía, formato de fecha, forma de la respuesta, significado del vacío y campos sensibles.

Después: `npm run inventario` para que el código nuevo aparezca en el catálogo, y `npm run audit:docs` para verificar que la documentación sigue resolviendo.

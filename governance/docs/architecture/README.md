# Arquitectura

Cómo está construido el frontend. Los **contratos de datos** ya no viven acá: se movieron a [gobierno del dato](../data/README.md), porque describen el dato y no la aplicación que lo muestra.

- [System overview](./system-overview.md) — capas, shell y navegación
- [Flujo de datos](./data-flow.md) — recorrido de una petición y responsabilidades
- [Inventario de módulos](./module-inventory.md) — módulos y rutas, derivado del código
- [Configuración de ejecución](./runtime-configuration.md) — providers, build, PWA y entornos
- [Sesión y preferencias](./session-preferences.md)
- [Registro de decisiones](./decision-records.md) y [ADR](./adr/)

## Dónde están los contratos

| Contrato | Documento |
|---|---|
| Transporte Winder / Ant | [data/contracts/winder-transport.md](../data/contracts/winder-transport.md) |
| Motores de reporte | [data/contracts/reporting-contracts.md](../data/contracts/reporting-contracts.md) |
| Jerarquía organizativa | [data/contracts/organizational-hierarchy.md](../data/contracts/organizational-hierarchy.md) |
| Navegación, roles y permisos | [data/contracts/access-model.md](../data/contracts/access-model.md) |

## Diagramas

Los diagramas viven junto al contrato o ADR que explican, no en una carpeta aparte. Convenciones:

- Mostrar la fuente de verdad y el sentido del flujo.
- Separar datos de presentación de decisiones de autorización.
- Versionarlos junto al documento que ilustran.
- Mermaid para flujos y secuencias, sin duplicar lo que ya está en [data-flow](./data-flow.md) o [linaje](../data/lineage.md).

## Regla

La arquitectura describe el **código vigente**. Cuando un documento y el código discrepan, gana el código y el documento se corrige. Las propuestas de backend se marcan como propuesta y llevan evidencia de validación.

# Registro de decisiones

Índice de decisiones técnicas. Las nuevas usan [la plantilla ADR](../templates/adr-template.md) y viven en [`adr/`](./adr/).

## ADR registrados

| ADR | Decisión | Estado |
|---|---|---|
| [ADR-0001](./adr/ADR-0001-zoneless-sin-onpush.md) | Zoneless con señales, sin `ChangeDetectionStrategy.OnPush` | Vigente |
| [ADR-0002](./adr/ADR-0002-color-por-token-css.md) | El color se aplica por token CSS, no por clase utilitaria | Vigente |
| [ADR-0003](./adr/ADR-0003-linea-base-de-gobernanza.md) | Línea base de gobernanza en lugar de "cero hallazgos" | Vigente |
| [ADR-0004](./adr/ADR-0004-anclas-de-tour-por-selector-estable.md) | Los recorridos guiados se anclan a selectores estables | Vigente |

## Decisiones vigentes sin ADR propio

Heredadas del diseño original; se documentan acá hasta que un cambio obligue a escribirles un ADR.

| Decisión | Estado | Evidencia |
|---|---|---|
| Angular standalone, zoneless y con señales | Vigente | [System overview](./system-overview.md) |
| Winder como adaptador de transporte hacia Ant | Vigente por compatibilidad | [Transporte Winder](../data/contracts/winder-transport.md) |
| Autorización en backend; el frontend solo presenta | Requerida | [Seguridad](../security/README.md), [Access model](../data/contracts/access-model.md) |
| Adyacencia más materialized path para navegación | Propuesta de backend | [Modelo de accesos](../data/contracts/access-model.md) |
| Frontend modular monolítico, sin federation activa | Vigente | [System overview](./system-overview.md) |
| Sin caché de respuestas de API en el service worker | Vigente | [Runtime configuration](./runtime-configuration.md) |

## Decisiones pendientes de tomar

Registradas en la [auditoría de septiembre 2026](../evidence/quality/auditoria-gobernanza-2026-09.md):

- Adoptar o descartar ESLint. Hoy el proyecto no tiene linter, y el auditor de gobernanza cubre arquitectura, no estilo de código.
- Activar o no `strict: true` en `tsconfig.json`, y con qué plan de migración.

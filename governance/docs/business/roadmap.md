# Roadmap

El roadmap de producto se mantiene como una lista de decisiones y capacidades verificables. Las fechas de auditorias historicas no deben confundirse con compromisos vigentes.

## Prioridades de gobierno de datos

| Prioridad | Resultado esperado | Evidencia |
|---|---|---|
| Alta | Autorizacion efectiva en backend, no solo en guards del frontend | [Security](../security/README.md) |
| Alta | Contratos Winder documentados por motor y reporte | [API contracts](../data/contracts/README.md) |
| Alta | Modelo de accesos versionado y validado en una base desechable | [Access model](../data/contracts/access-model.md) |
| Media | Inventario de fuentes y dominios | Parcial — [catálogo de datos](../data/catalog.md); faltan los propietarios funcionales |
| Alta | **Asignar propietario funcional por dominio** | Pendiente — es la brecha que bloquea el escalamiento de una cifra dudosa ([responsabilidades](../data/stewardship.md)) |
| Media | Inventario de campos sensibles por contrato | Parcial — [clasificación](../data/classification.md); se completa por ficha de reporte |
| Media | Evidencia automatica de calidad, cobertura y rendimiento | [Reports](../evidence/README.md) |

Cada item debe convertirse en una decision, una tarea y una prueba antes de marcarse como completo.

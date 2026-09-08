# Responsabilidades sobre el dato

Quién decide qué. Sin esto, una cifra dudosa no tiene a quién escalarse y la corrección queda en manos de quien tocó el código último.

## Roles

| Rol | Responsabilidad | Quién |
|---|---|---|
| **Propietario funcional** | define qué significa la cifra, aprueba su fórmula, autoriza un cambio de significado y responde por su exactitud | Negocio, por dominio — **por confirmar** |
| **Custodio técnico del origen** | produce el dato: strand, `cod_rep`, motor y cálculo | Backend Ant |
| **Custodio técnico de presentación** | mantiene el contrato del borde, el mapeo y la pantalla | Equipo frontend MIS Host |
| **Consumidor** | usa la cifra para decidir, y reporta cuando no cuadra | Usuarios del portal |
| **Auditor de datos** | verifica que el contrato sea trazable y que la documentación describa el código | Fase 4 del [pipeline de agentes](../../agents/04-auditor-contratos-datos.md) |

El frontend es **custodio de presentación, nunca propietario**. No puede crear ni corregir un dato de negocio: un mapeo que "arregla" una cifra está ocultando un defecto del origen.

> Los propietarios funcionales por dominio están sin asignar. Es la brecha de gobierno más significativa que queda, porque sin ella los pasos de escalamiento de abajo terminan en un destinatario indefinido. Registrada en el [catálogo](./catalog.md) y en el [roadmap](../business/roadmap.md).

## Quién decide sobre qué cambio

| Cambio | Decide | Requiere |
|---|---|---|
| Renombrar un campo del modelo de vista | Frontend | mapeo documentado en la ficha |
| Cambiar el nivel de jerarquía de un reporte | Propietario funcional | actualizar ficha y specs |
| Cambiar el `cod_rep` de una pantalla | Backend + propietario funcional | ADR si rompe compatibilidad |
| Cambiar la forma de la respuesta de un strand | Backend | ADR, prueba de contrato y plan de migración |
| Agregar un término al glosario | Quien lo introduce | responsable, fuente y consumidores declarados |
| Clasificar un campo como sensible | Seguridad + propietario funcional | actualizar [clasificación](./classification.md) |
| Cerrar un hallazgo de datos | Auditor de datos | prueba de regresión, no solo la corrección |

## Escalamiento de una cifra dudosa

```text
1. Consumidor reporta        → incidente en evidence/quality/incidents.md
2. Frontend traza el linaje  → jerarquía, fecha, mapeo (pasos 1 a 5 de lineage.md)
3a. El frontend la alteró    → corrige + agrega el spec que lo habría detectado
3b. Llegó mal del backend    → escala al propietario funcional del dominio
4. Se cierra                 → con prueba de regresión y el incidente actualizado
```

El paso 2 es el que evita la discusión estéril: antes de escalar, hay que poder decir qué `cod_rep`, qué nodo y qué fecha de corte produjeron el número.

## Ciclo de vida de un contrato

1. **Propuesto** — la [ficha de reporte](../templates/report-spec-template.md) se completa antes de escribir código.
2. **Vigente** — implementado, con specs que distinguen vacío de error, y registrado en el [catálogo](./catalog.md).
3. **En cambio** — modificación incompatible: exige ADR, prueba de contrato y plan de migración.
4. **Deprecado** — se conserva por compatibilidad y se marca como tal. Los strands `reportData` están acá.
5. **Retirado** — se elimina del código **y del catálogo**. Un contrato retirado que sigue documentado es peor que no documentarlo.

## Obligaciones permanentes del equipo frontend

- No inventar, corregir ni completar datos de negocio en el cliente.
- Conservar los nombres del backend en el borde y documentar todo renombre.
- Distinguir vacío de error en cada servicio, con specs que lo prueben.
- Declarar jerarquía y fecha de corte de cada consulta.
- No presentar un control de interfaz como si fuera autorización.
- Mantener la documentación al día en el mismo cambio: cuando el documento y el código discrepan, gana el código y el documento se corrige.

# Seguridad

Controles que afectan a la identidad, la sesión y el acceso al dato.

- [Modelo de amenazas](./threat-model.md) — activos, fronteras de confianza y abusos prioritarios
- [Hallazgos](./findings.md) — riesgos identificados y su estado real
- [Plan de remediación](./remediation-plan.md)
- [Pentest](./pentest.md) — alcance y criterio de cierre

## Controles prioritarios

- El backend debe autenticar y autorizar **cada operación**: guards y menú no son controles suficientes.
- Las claves y secretos no deben vivir en el bundle público.
- Sesiones, permisos y eventos de seguridad necesitan trazabilidad y vigencia.
- Los contratos declaran campos sensibles, errores y reglas de retención cuando el backend los confirma.
- Los datos de prueba son ficticios y no copian información financiera real.

## Relación con el gobierno del dato

La clasificación de los datos y el inventario de campos sensibles viven en [`data/classification.md`](../data/classification.md); el modelo de acceso y navegación, en [`data/contracts/access-model.md`](../data/contracts/access-model.md). Esta área define los controles; el área de datos define **qué** hay que proteger.

Un hallazgo se cierra solo con corrección implementada, prueba reproducible y evidencia de que no reaparece en build o E2E. Ocultarlo en el frontend no cuenta.

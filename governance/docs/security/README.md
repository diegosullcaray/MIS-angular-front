# Seguridad y gobierno de datos

Este indice organiza los controles que afectan datos y autorizacion.

## Controles prioritarios

- El backend debe autenticar y autorizar cada operacion; guards y menu no son controles suficientes.
- Las claves y secretos no deben vivir en el bundle publico.
- Las sesiones, permisos y eventos de seguridad deben tener trazabilidad y vigencia.
- Los contratos deben declarar campos sensibles, errores y reglas de retencion cuando el backend los confirme.
- Los datos de prueba deben ser ficticios y no copiar informacion financiera real.

## Evidencia

- [Hallazgos y riesgos](./findings.md)
- [Plan de remediacion](./remediation-plan.md)
- [Pentest](./pentest.md)
- [Modelo de amenazas](./threat-model.md)
- [Modelo de acceso](../architecture/api-contracts/access-model.md)

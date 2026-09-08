# Evidencia

Resultados reproducibles de pruebas, mediciones y auditorías. **Separa la evidencia generada de la documentación normativa**: los archivos de acá registran lo que se observó, no lo que debería pasar.

- [Política de evidencia](./evidence-policy.md) — campos obligatorios y reglas
- [Calidad](./quality/README.md) — auditorías e incidentes
- [Rendimiento](./performance/README.md) — comparación con el legado, responsive y color
- [Cobertura](./coverage/README.md) — reportes de cobertura generados
- Plantilla: [reporte de evidencia](../templates/evidence-report-template.md)

## Reglas

- Los archivos generados no se editan a mano ni se usan como fuente de verdad de arquitectura.
- Toda cifra debe poder regenerarse desde el comando o test que la produjo.
- Sin datos personales ni financieros reales, sin secretos ni cabeceras completas ([clasificación](../data/classification.md)).
- Un hallazgo de seguridad nunca se cierra porque el frontend lo oculte.

> Esta carpeta se llamaba `reports/`. Se renombró a `evidence/` porque "reportes" es el nombre del dominio de negocio central del sistema, y las dos cosas se confundían constantemente.

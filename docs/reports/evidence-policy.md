# Politica de evidencia

Los reportes de `docs/reports` registran resultados reproducibles. No reemplazan el codigo, una prueba automatizada ni un contrato de datos.

## Campos obligatorios

- Nombre del flujo o componente.
- Commit o version evaluada.
- Fecha y entorno.
- Navegador y viewport si es UI.
- Usuario/rol simulado y fecha de corte si aplica.
- Datos mock o fuente utilizada.
- Resultado esperado y resultado observado.
- Evidencia: captura, trace, log o enlace a prueba.
- Estado: aprobado, fallido, bloqueado o pendiente.

## Reglas

- No incluir datos personales o financieros reales.
- No copiar secretos, tokens ni headers completos.
- Separar evidencia historica de evidencia vigente.
- Las cifras deben poder regenerarse desde el comando o test que las produjo.
- Un hallazgo de seguridad nunca se marca cerrado solo porque el frontend lo oculte.

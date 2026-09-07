# Legacy comparison

La comparación con STG identificó tres causas principales de degradación: timeouts arbitrarios en el cliente, errores de backend confundidos con tablas vacías y solicitudes repetidas de jerarquia.

## Estado esperado

- No imponer un timeout de frontend que contradiga el contrato del backend.
- Diferenciar respuesta vacía, error HTTP, error de red y error de mapeo.
- Cachear la jerarquia por usuario y fecha de corte durante la sesión.

La validación se realiza con las pruebas E2E de cache, reportes y rendimiento.

# Convenciones de desarrollo

## Antes de editar

1. Ubicar ruta, componente, servicio y modelo dueño.
2. Confirmar el contrato del backend y la fecha de corte.
3. Buscar una prueba vecina y una pantalla con el mismo patrón.

## Durante el cambio

- Mantener `core` libre de dependencias de pantallas.
- Mantener `shared/ui` libre de dependencias de dominios.
- Preferir `signal`, `computed`, `effect`, `input` y `output` según el flujo existente.
- Separar constantes de backend, modelos, mapeos puros y transporte.
- No guardar secretos, tokens ni datos reales en codigo o fixtures.

## Antes de cerrar

- Ejecutar la prueba unitaria mas cercana.
- Ejecutar E2E si cambia ruta, shell, permisos o flujo de datos.
- Actualizar contrato y documentacion.
- Revisar estados vacio, error, reintento, responsive y accesibilidad.

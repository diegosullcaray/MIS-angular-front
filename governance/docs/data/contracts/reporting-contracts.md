# Reporting contracts

Los reportes usan cuatro motores del backend: `regularData`, `table.regular`, `graphicData` y `reportData` legado.

- `regularData` devuelve tablas multi-encabezado y bloques mixtos.
- `table.regular` devuelve columnas dinámicas y headers serializados.
- `graphicData` devuelve bloques gráficos.
- `reportData` solo se conserva para compatibilidad.

Cada reporte debe declarar `cod_rep`, motor, parámetros de jerarquia, fecha de corte, forma de respuesta, estados vacio/error y reglas de exportación.

La implementación visual y los tipos compartidos se mantienen en `src/app/shared/ui/`.

Para implementar un reporte nuevo sigue [report creation guide](./report-creation-guide.md) y completa la [ficha de reporte](../features/report-spec-template.md). La ficha obliga a resolver primero modulo, jerarquia, motor, estructura de tabla y estados antes de escribir codigo.

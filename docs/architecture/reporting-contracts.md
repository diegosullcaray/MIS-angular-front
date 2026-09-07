# Reporting contracts

Los reportes usan cuatro motores del backend: `regularData`, `table.regular`, `graphicData` y `reportData` legado.

- `regularData` devuelve tablas multi-encabezado y bloques mixtos.
- `table.regular` devuelve columnas dinámicas y headers serializados.
- `graphicData` devuelve bloques gráficos.
- `reportData` solo se conserva para compatibilidad.

Cada reporte debe declarar `cod_rep`, motor, parámetros de jerarquia, fecha de corte, forma de respuesta, estados vacio/error y reglas de exportación.

La implementación visual y los tipos compartidos se mantienen en `src/app/shared/ui/`.

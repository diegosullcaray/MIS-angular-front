# Testing

La estrategia combina pruebas unitarias del frontend y pruebas E2E con Playwright. El inventario verificable esta en [test inventory](./test-inventory.md). Los flujos que consultan datos deben cubrir carga, vacio, error y permisos.

- Unitarias: servicios, mapeos y componentes aislados.
- E2E: login, guards, navegacion, reportes y responsive.
- Datos: validar fecha de corte, nodo organizativo, `cod_rep` y motor de reporte.
- Seguridad: comprobar que ocultar un item no sustituye la autorizacion del backend.

Ver [reports](../reports/README.md) para separar evidencia generada de documentacion normativa.

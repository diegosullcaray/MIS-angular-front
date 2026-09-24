# Testing

La estrategia combina pruebas unitarias del frontend y pruebas E2E con Playwright. El inventario verificable esta en [test inventory](./test-inventory.md). Los flujos que consultan datos deben cubrir carga, vacio, error y permisos.

- Unitarias: servicios, mapeos y componentes aislados.
- E2E: login, guards, navegacion, reportes y responsive.
- Datos: validar fecha de corte, nodo organizativo, `cod_rep` y motor de reporte.
- Seguridad: comprobar que ocultar un item no sustituye la autorizacion del backend.

## URLs de los E2E

Una URL que no existe no hace fallar la prueba: cae en el comodín `**` y abre el explorador, así que el E2E pasa sin abrir la pantalla que nombra ([INC-2026-09-23-01](../evidence/quality/incidents.md)).

- **Rutas reales.** Toda URL `'/app/…'` de `e2e/` debe coincidir con un `path:` declarado. Lo verifica la regla `e2e-rutas-vigentes`.
- **Carpetas del explorador.** Si la URL es a propósito una carpeta, que resuelve `**`, se marca en la misma línea con `// gobernanza: ruta-de-carpeta`.
- **Al retirar una pantalla,** se quita su URL de las listas de humo y se reemplaza en las pruebas que la usaban como ejemplo general ([guía de retiro](./report-retirement-guide.md)).

## Fallos que no son tuyos

Si Playwright falla en áreas que el cambio no toca, compara con el commit anterior antes de atribuir el fallo; el procedimiento está en la [guía de retiro](./report-retirement-guide.md#4-verificación-obligatoria). Los fallos conocidos y abiertos se registran en [incidentes](../evidence/quality/incidents.md) y no se silencian con `skip`.

Ver [evidence](../evidence/README.md) para separar evidencia generada de documentación normativa.

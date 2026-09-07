# Modelo de acceso y navegacion

La propuesta de gobierno de accesos separa identidad, puestos, roles, nodos, permisos, sesiones y eventos de seguridad. Los artefactos SQL de validacion permanecen como material tecnico de referencia.

## Principios

- `seg.nodes.parent_id` es la fuente de verdad del arbol.
- `path`, `depth` y `sort_path` son derivados; no deben escribirse manualmente.
- `SUBTREE` hereda hacia abajo y `NODE` concede solo el nodo.
- La concesion mas especifica gana; a igual profundidad, `DENY` gana a `ALLOW`.
- Los permisos de varios roles se agregan sin restar capacidades.
- Las carpetas contenedoras pueden aparecer para explicar el camino, pero no conceden por si mismas acceso a un reporte.
- El backend debe ejecutar la decision final con `seg.fn_user_can`; el menu recibido por el frontend es presentacion.

## Estado

Es una propuesta de modelo de backend. Los scripts no se han ejecutado en esta maquina y requieren validacion en una base desechable antes de promoverse.

# ADR-0008: La navegación se construye solo desde `list_sec`

- Estado: Vigente
- Fecha: 2026-10-05
- Responsables: Frontend MIS Host

## Contexto

En `stg-app-mis-r22` toda la navegación sale de la consulta `list_sec` (`getMenuItems(email)`): los ítems sin `cod_par` son los sistemas, los hijos se enlazan por `cod_par`, todo se ordena por `order_sec` y la ruta de cada ítem es su `act_sec`. No existen paneles ni rutas escritas a mano. El legado la presenta en un menú Inicio del header; MIS Host conserva su diseño (barra lateral y explorador), pero los datos deben ser los mismos.

El Host había acumulado excepciones por nombre: un panel de "Analista" con el enlace a Categorización fijo, la ruta `/app/dashboards` forzada para "Dashboards Integrados", y `cod_sec` usado como ruta cuando faltaba `act_sec`. Cada una era un dato que el backend ya entrega y que se desincronizaba si el menú cambiaba.

## Decisión

- El árbol de sistemas, carpetas y pantallas sale únicamente de `list_sec`. No se agregan rutas, etiquetas ni paneles de menú en el frontend.
- La ruta de un ítem es `act_sec` normalizado bajo `/app/`. **Sin `act_sec` no hay ruta**: no se deriva de `cod_sec`.
- Un hijo sin ruta ni descendientes no es navegación (p. ej. un ítem que el backend manda y el Host resuelve con un diálogo) y se omite; si no queda ningún hijo, el sistema no abre panel.
- Excepciones aceptadas, ambas por ser del shell o de otra consulta del backend: el ícono **Inicio** (aterrizaje del shell, no un ítem de menú) y el panel de categorías de **Ranking Kaypacha** (`getListRanking`). Una excepción nueva requiere un ADR.

## Consecuencias

- Cambiar el menú en el backend cambia la navegación sin tocar el frontend.
- Una pantalla migrada solo es alcanzable si su segmento de `app.routes.ts` coincide con el `act_sec` que devuelve el menú; si el menú trae un `act_sec` sin pantalla, la URL cae en el comodín del módulo.
- Las pruebas del sidebar cubren que el panel de un sistema usa los hijos del backend tal cual, y las del servicio de menú que `act_sec` ausente no genera ruta.

## Evidencia

- Implementación: `src/app/pages/full-pages/layout/services/menu-stg.service.ts` y `src/app/pages/full-pages/layout/services/navegacion-sistemas.service.ts`.
- Pruebas: `src/app/pages/full-pages/layout/services/menu-stg.service.spec.ts` y `src/app/pages/full-pages/layout/components/sidebar/sidebar.component.spec.ts`.
- Árbol de menú legacy: `src/app/system/admin/services/` (archivo `navigation.service.ts`) en `stg-app-mis-r22`.
- Presentación legacy (menú Inicio): `src/app/system/admin/components/start-menu/` en `stg-app-mis-r22`.

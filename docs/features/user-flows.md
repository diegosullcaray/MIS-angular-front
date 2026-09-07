# Flujos de usuario

## Sesion

1. El usuario entra por `/login`.
2. Google devuelve identidad; `AuthService` consulta el perfil en Ant.
3. Se persiste la sesion con expiracion en `sessionStorage`.
4. `authGuard` protege `/app`.
5. Un `401` de rutas Host dispara cierre de sesion; login y Google quedan excluidos.

## Navegacion

1. El shell carga menu y sistemas desde Ant.
2. Sidebar selecciona sistema o ruta.
3. Si el sistema tiene subnavegacion, se muestra el explorador hasta elegir un item.
4. Header calcula breadcrumb y recientes desde la ruta final.

## Reporte

1. Se selecciona nodo de jerarquia.
2. `HierSelectorComponent` carga raiz y niveles con cache.
3. El servicio del modulo arma parametros y strands.
4. El mapeo transforma la respuesta en modelo de tabla/grafico.
5. La pantalla muestra carga, datos, vacio o error con reintento.

## Cambio de usuario

El cambio a un alterno limpia el cache de jerarquia, cambia identidad y conserva la identidad original para volver. Deben probarse datos, menu, breadcrumb, recientes y permisos despues del cambio.

## Configuracion

Tema, fondo, acento, modo de sidebar, vista del explorador y anuncios se gestionan desde preferencias. El cierre de sesion debe limpiar el estado y el almacenamiento.

## Evidencia E2E

Los flujos tienen suites para login, guards, cambio de usuario, reportes, jerarquia, configuracion, comunicados, responsive, errores y expiracion.

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

1. El usuario abre el menú de perfil y elige **Cambiar perfil**.
2. El shell abre un diálogo modal con los perfiles autorizados; cada fila muestra nombre y cargo.
3. El usuario selecciona una fila y confirma con **Cambiar perfil**. Cancelar, Escape o clic fuera no cambia la identidad.
4. `AuthService` cambia al alterno, conserva la identidad original y persiste la sesión actualizada. Si ya está en un alterno, el mismo diálogo ofrece volver a la identidad original.
5. El cambio limpia el cache de jerarquía y los datos dependientes de identidad. Deben probarse datos, menú, breadcrumb, recientes y permisos después del cambio.

La selección vive solo mientras el diálogo está abierto; no se persiste ni se ejecuta por un clic accidental en el menú.

## Configuracion

Tema, fondo, acento, modo de sidebar, vista del explorador y anuncios se gestionan desde preferencias. El cierre de sesion debe limpiar el estado y el almacenamiento.

## Evidencia E2E

Los flujos tienen suites para login, guards, cambio de usuario, reportes, jerarquia, configuracion, comunicados, responsive, errores y expiracion.

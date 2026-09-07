# Modelo de amenazas

## Activos

- Identidad, token y usuario alterno.
- Roles, subsistemas y menu autorizado.
- Datos financieros de reportes y fecha de corte.
- Secretos de Winder y configuracion de endpoints.
- Preferencias y trazas de navegacion del usuario.

## Fronteras de confianza

| Frontera | Riesgo | Control actual | Limitacion |
|---|---|---|---|
| Navegador -> bundle | Exposicion de secretos | `verify:bundle`, file replacement | No puede ocultar secretos que el cliente necesita |
| Login Google -> Host | Token o claims manipulados | `OAuthService`, validacion de ID token | Usa `initImplicitFlow`; requiere PKCE |
| Host -> Ant/Winder | Alteracion o replay | HTTPS y cifrado Winder | AES-CBC/IV y claves en cliente deben retirarse |
| Host -> API | Acceso no autorizado | Bearer, guard e interceptor | El guard y `X-User-Role` no sustituyen autorizacion server-side |
| Sesion -> equipo compartido | Persistencia residual | limpieza de storage, caches y workers | Cookies HttpOnly solo las puede revocar el backend |

## Abusos prioritarios

1. Descargar el bundle y recuperar secretos.
2. Fabricar o reutilizar un token o rol en el cliente.
3. Acceder por URL directa a una ruta ocultada del menu.
4. Leer datos de otro usuario alterno por cache de jerarquia.
5. Exfiltrar informacion mediante logs, errores o almacenamiento local.

## Controles requeridos

- Autorizacion por recurso y accion en backend.
- Rotacion y retirada de claves del frontend.
- OAuth Authorization Code con PKCE.
- CSP, politicas de cookies y validacion de origen.
- Pruebas de acceso directo a rutas y de cambio de usuario.
- Inventario de campos sensibles por contrato.

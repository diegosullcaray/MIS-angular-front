# Session and preferences

Las preferencias de interfaz y el cierre de sesion son responsabilidades separadas de los contratos de negocio.

- Las preferencias se saneen antes de persistirse.
- El cierre debe limpiar almacenamiento, cookies visibles, caches y service workers cuando sea posible.
- Las preferencias no deben transportar autorizacion.
- El usuario alterno debe invalidar el contexto de jerarquia y reportes cacheado.

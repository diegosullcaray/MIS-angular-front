# Hallazgos de seguridad

Este documento concentra los riesgos de seguridad identificados en la auditoria del MIS.

## Prioridad alta

- Las claves criptograficas en un bundle publico no constituyen secreto.
- AES-CBC con IV fijo no ofrece autenticidad ni aleatoriedad suficiente.
- La autorizacion solo en guards del navegador no protege el backend.
- Falta una politica CSP y debe revisarse el flujo OAuth hacia PKCE.

## Evidencia actual del checkout

- `src/environments/environment.ts` y `environment.prod.ts` contienen `cypherSecret` y secretos por modulo.
- `AuthService.iniciarLoginGoogle()` llama `initImplicitFlow()`.
- `authGuard` decide acceso por la señal local de usuario.
- `authInterceptor` excluye Winder de `Authorization` y adjunta `X-User-Role` solo a rutas Host.

Estos hechos describen el estado actual; no deben presentarse como riesgos ya resueltos.

Los tres primeros requieren cambios coordinados con backend. El frontend debe evitar secretos, manejar errores sin ocultarlos y tratar el menu como presentacion.

# Modelo de estados

## Estado del shell

`ShellStateService` mantiene señales de solo lectura para usuario activo, menu activo, icono del sidebar, cierre de sesion, seleccion pendiente y rail superpuesto. Sus mutadores son operaciones del Host.

## Estado de autenticacion

`AuthService` mantiene token, alternos, usuario original y expiracion. Cambiar de usuario limpia el cache de jerarquia y actualiza la sesion persistida.

## Estado de preferencias

`PreferenciasService` mantiene apariencia, estructura, anuncios y reportes recientes. El repositorio local usa una sola clave saneada; el adaptador DOM convierte preferencias en variables CSS y atributos de `<html>`.

## Estado de datos

Cada pantalla dueña de datos debe distinguir:

```text
idle -> loading -> success(data)
                  -> success(empty)
                  -> error(retryable)
                  -> error(fatal)
```

El estado `loading` no autoriza por si mismo, y `empty` no debe ocultar errores HTTP o de mapeo.

## Regla de ownership

- El modulo dueño muta estado de negocio.
- `shared/ui` recibe snapshots y emite eventos.
- El shell no interpreta payloads de reportes.
- La cache debe incluir identidad, jerarquia y fecha de corte cuando esos datos cambien el resultado.

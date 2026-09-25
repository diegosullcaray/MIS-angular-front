# Modelo de estados

## Estado del shell

`ShellStateService` mantiene señales de solo lectura para usuario activo, menu activo, icono del sidebar, cierre de sesion, seleccion pendiente y rail superpuesto. Sus mutadores son operaciones del Host.

## Estado de autenticacion

`AuthService` mantiene token, alternos, usuario original y expiracion. Cambiar de usuario limpia el cache de jerarquia y actualiza la sesion persistida.

`HeaderComponent` mantiene el estado efímero del flujo de cambio (`selectorPerfilOpen`, `perfilSeleccionado` y `cambiandoPerfil`). El header solo abre el diálogo; `AuthService` es el único dueño de la mutación de identidad. Cerrar o cancelar el diálogo descarta la selección.

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

`loading` se representa **por tabla**, no por pantalla: cada tabla tiene su propio estado de carga
(`[cargando]`/`[loading]`) y pinta su esqueleto, y en un reporte de varias tablas cada una sale de
`loading` apenas llega su respuesta. El spinner global (`LoadingService`) solo cubre desde que
arranca una consulta hasta su primera respuesta. Una consulta nueva cancela la anterior. Ver
[estandar de reportes](../components/estandar-reportes.md#2-tablas).

## Regla de ownership

- El modulo dueño muta estado de negocio.
- `shared/ui` recibe snapshots y emite eventos.
- El shell no interpreta payloads de reportes.
- La cache debe incluir identidad, jerarquia y fecha de corte cuando esos datos cambien el resultado.

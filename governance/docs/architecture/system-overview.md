# System overview

MIS Host es una aplicacion Angular standalone, zoneless, con señales, PrimeNG y Tailwind. Hoy es un frontend modular monolitico con rutas lazy locales; no hay llamadas `loadRemoteModule` ni una federation activa en `app.routes.ts`. El flujo de datos es:

```text
Componente -> servicio del modulo -> fachada de reportes -> Winder/Ant -> HttpClient
```

## Capas

- `core/`: sesion, guards, interceptores, transporte y envoltorios del navegador.
- `pages/full-pages/`: shell, autenticacion y error. El layout es dueno de las preferencias de interfaz.
- `pages/modules/`: dominios de negocio y pantallas.
- `shared/`: UI y utilidades reutilizables.
- `theme/`: tokens, preset visual y aritmetica de color.

`core/` no contiene ninguna carpeta con nombre de pantalla: lo que solo usa una
vive con ella. Preferencias y recientes estuvieron en `core/` hasta 2026-09-08 y
bajaron al layout y al modulo Home respectivamente.

## Shell y navegacion

`ShellLayoutComponent` compone header, sidebar, explorador, overlay de carga y anuncios. `MenuStgService` obtiene la navegacion del backend Ant; `ShellStateService` conserva identidad y estado de presentacion. El menu controla visibilidad y orientacion, pero no reemplaza la autorizacion server-side.

Los contratos de transporte, reportes y jerarquia estan en [API contracts](../data/contracts/README.md). La autorizacion del backend se documenta en [access model](../data/contracts/access-model.md).

Para el detalle de providers, build, PWA y entornos ver [runtime configuration](./runtime-configuration.md). Para el inventario funcional ver [module inventory](./module-inventory.md).

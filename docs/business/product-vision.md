# Vision del producto

MIS Host es un frontend modular monolitico para el portafolio MIS: autentica, presenta el shell y enruta al usuario hacia sus sistemas y reportes autorizados. La arquitectura de remotes es una frontera prevista, no una capacidad activa demostrada por las rutas actuales.

## Principios

- La autorizacion definitiva pertenece al backend.
- El frontend presenta datos mediante contratos tipados y componentes standalone.
- La navegacion debe conservar contexto, jerarquia organizativa y fecha de corte.
- La interfaz mantiene una experiencia consistente mediante tokens de diseño.

La arquitectura tecnica se describe en [System overview](../architecture/system-overview.md).

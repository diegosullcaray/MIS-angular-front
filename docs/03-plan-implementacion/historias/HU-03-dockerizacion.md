> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [TRD](../../01-canon/03-trd.md)

# HU-03 — Dockerización del Host

**Como** equipo de operaciones, **quiero** una imagen Docker del Host que sirva el build
de producción, **para** poder desplegarlo en Dokploy/Coolify de forma independiente de
cualquier Remote.

**Tamaño:** M &nbsp;&nbsp; **Prioridad:** 🟡 Media &nbsp;&nbsp; **Depende de:** HU-00 (no dockerizar un build con rutas rotas)

## Contexto

Corresponde a la antigua Fase 6 del plan por fases (ver
[`00-plan-fases-original.md`](../00-plan-fases-original.md)), aún pendiente. El TRD §7 ya
trae la plantilla de Dockerfile base — esta HU es construirla y probarla, no diseñarla
desde cero.

## Alcance

**Sí incluye:** Dockerfile multi-stage, `nginx.conf` para SPA, `.dockerignore`,
verificación de build local.

**No incluye:** pipeline de CI/CD en Dokploy/Coolify contra el registry privado (eso
requiere acceso a infraestructura que no depende solo de este repo — se documenta como
paso manual siguiente, no como parte de esta HU).

## Pasos

- [ ] `Dockerfile` multi-stage (`node:20-alpine` build → `nginx:alpine` serve), siguiendo
      la plantilla del TRD §7.
- [ ] `nginx.conf`: redirect de rutas SPA a `index.html`, cache de assets estáticos,
      proxy `/api` → variable de entorno del backend.
- [ ] `.dockerignore` (node_modules, dist, .git, docs/).
- [ ] `docker-compose.yml` de desarrollo local (Host + placeholder de backend/Postgres,
      aunque el backend real aún no exista — HU-04/05).
- [ ] `docker build -t mis-host:local .` y `docker run` sirviendo el Host en un puerto
      local.

## Criterios de aceptación

- Dado el Dockerfile, cuando se ejecuta `docker build -t mis-host:local .`, entonces
  termina sin errores.
- Dado el contenedor corriendo, cuando se navega a `http://localhost:<puerto>/inicio`
  (o `/admin` si HU-02 ya cambió el prefijo), entonces la SPA carga y las rutas internas
  no dan 404 al refrescar (verifica que `nginx.conf` redirige correctamente).

## Archivos afectados

- Crear: `Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`

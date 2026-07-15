# 03 — Implementation Plan del Frontend (Plantilla → Sistema Hijo)
> **Proyecto:** MIS — Plantilla base de sistema hijo (frontend)  
> **Documentación Activa:** [01_PRD_PLANTILLA](./01_PRD_PLANTILLA.md) | [02_INDICACIONES_Y_RESTRICCIONES](./02_INDICACIONES_Y_RESTRICCIONES.md) | [03_IMPLEMENTATION_PLAN](./03_IMPLEMENTATION_PLAN.md)  
> **Versión:** 1.0.0  
> **Fecha:** 2026-07-14  
> **Estado:** 🟢 Fase 0 completada (plantilla lista) · Fases 1–6 se ejecutan por cada sistema hijo

---

## Resumen Ejecutivo

Ruta crítica para llevar **esta plantilla** hasta un **sistema hijo en producción,
embebido en el MIS**. La FASE 0 (base técnica) ya está resuelta por la plantilla;
cada equipo de subsistema ejecuta las fases 1–6 sobre su clon. El backend propio
(guía 08 §5 del Host) avanza en paralelo a partir de la FASE 3.

---

## Convenciones de este Documento

| Símbolo | Significado |
|---|---|
| `[ ]` | Tarea pendiente |
| `[/]` | Tarea en progreso / parcial |
| `[x]` | Tarea completada |
| 🔴 | Tarea bloqueante |

---

## ✅ FASE 0 — Base técnica de la plantilla 🔴 (COMPLETADA — la provee este repo)

- [x] **F0-01** · Workspace Angular 22 standalone, `strict`, sin `zone.js` + `provideZonelessChangeDetection()`
- [x] **F0-02** · Native Federation como **Remote**: `federation.config.mjs` (shareAll singleton + strictVersion + denseChunking) y `exposes './Component'`
- [x] **F0-03** · `main.ts` → `initFederation()` → `bootstrap.ts` (arranque standalone para desarrollo aislado)
- [x] **F0-04** · Design system del Host: `mis-theme.ts` + `tokens.css` + Tailwind v4 + PrimeNG (`ripple: false`)
- [x] **F0-05** · `remote-root.component.ts` (export `default`) con deep-linking por URL y navegación interna por signals
- [x] **F0-06** · `ShellContractService`: signals de solo lectura (`usuarioActivo`, `esAdmin`, `esAdminSistema`, `subsistemas`, `tieneAccesoPropio`, `token`)
- [x] **F0-07** · `authInterceptor` del remote (JWT del Host → backend propio)
- [x] **F0-08** · Vistas de ejemplo: dashboard (contrato de la shell) + tabla/Signal Form (patrones de UI del MIS)
- [x] **F0-09** · `Dockerfile` multi-stage + `nginx.conf` con CORS para `remoteEntry.json`
- [x] **F0-10** · `npm run build` verificado: genera `remoteEntry.json` + chunks federados

---

## ⏳ FASE 1 — Adopción de la plantilla 🔴 (por cada sistema hijo)

- [ ] **F1-01** · Clonar la plantilla como `mis-remote-<dominio>` (repositorio propio del equipo)
- [ ] **F1-02** 🔴 · Renombrar el slug `subsistema-plantilla` → `subsistema-<dominio>` en:
  `federation.config.mjs` (`name`) y `shell-contract.service.ts` (`SLUG_SUBSISTEMA`)
- [ ] **F1-03** · Asignar el puerto de la convención (guía 08 §3) en `angular.json` (`serve` y `serve-original`)
- [ ] **F1-04** · Actualizar `package.json` (`name`) e `index.html` (`<title>`)
- [ ] **F1-05** · `npm install --legacy-peer-deps` + `npm start`: el remote levanta aislado en su puerto
- [ ] **F1-06** · `npm run build`: `remoteEntry.json` generado con el nuevo slug

---

## ⏳ FASE 2 — Prueba de integración temprana con el Host 🔴

> Se hace ANTES de desarrollar el dominio, con las vistas de ejemplo de la plantilla,
> para validar el contrato de federación desde el inicio.

- [ ] **F2-01** · Agregar el remote al `federation.manifest.json` del Host local: `"subsistema-<dominio>": "http://localhost:<puerto>/remoteEntry.json"`
- [ ] **F2-02** · Alta temporal en `/admin/sistemas/nuevo` (slug idéntico) y habilitar el subsistema a un rol de prueba
- [ ] **F2-03** 🔴 · Verificar CA-01/CA-02: el Host carga el remote sin recargar el navegador y sin iframes
- [ ] **F2-04** · Verificar los 3 estados del wrapper: skeleton al cargar, contenido, y **error elegante** con el remote apagado
- [ ] **F2-05** · Verificar el contrato: el dashboard de ejemplo muestra usuario/rol/subsistemas de la sesión real
- [ ] **F2-06** · Verificar deep-linking: `/subsistema-<dominio>/ejemplo` abre la vista interna y el breadcrumb del Host la refleja

---

## ⏳ FASE 3 — Modelado del dominio (vistas propias)

- [ ] **F3-01** · Definir el mapa de vistas internas del subsistema (dashboard + listas + detalles) y sus subrutas `/{slug}/<vista>`
- [ ] **F3-02** · Reemplazar `pages/dashboard` y `pages/ejemplo` por las vistas reales (mantener patrones: `p-card` + header/body, `p-selectButton`, estados vacío/carga/error)
- [ ] **F3-03** · Modelos del dominio en `models/` + services con signals (`isLoading/error/datos` + computed), como los services del Host
- [ ] **F3-04** · Formularios con **Signal Forms** exclusivamente (validadores `required`, `email`, `pattern`, `applyWhen`…)
- [ ] **F3-05** · Control de acciones por rol leyendo `esAdmin()` / `esAdminSistema()` del contrato (defensivo: la autorización real la hace el backend)
- [ ] **F3-06** · Actualizar `remote-root.component.ts`: mapa `vista ↔ subruta` del dominio

---

## ⏳ FASE 4 — Conexión al backend propio

> El backend (Spring Boot + BD propia) se construye en paralelo según guía 08 §5.

- [ ] **F4-01** · Definir el contrato REST `/api/<dominio>/v1/*` (formato `ApiError` y `PageResponse<T>` del doc 04 del Host)
- [ ] **F4-02** · (Opcional) Fake API local del hijo con `HttpInterceptorFn`, contrato 1:1, para desarrollar sin backend
- [ ] **F4-03** · Services consumiendo la API propia con `HttpClient` (+ `authInterceptor` ya provisto)
- [ ] **F4-04** 🔴 · Manejo de `401/403`: releer la sesión del Host (`leerSesionDelHost()`) y mostrar estado de acceso denegado del área de contenido (sin romper la shell)
- [ ] **F4-05** · E2E local: Host + remote + backend hijo levantados, flujo completo con JWT real

---

## ⏳ FASE 5 — Dockerización y despliegue

- [ ] **F5-01** · Ajustar `nginx.conf`: `Access-Control-Allow-Origin` = dominio real del Host (quitar `*`)
- [ ] **F5-02** · `docker build` + prueba del contenedor: `remoteEntry.json` accesible con CORS y sin caché
- [ ] **F5-03** · Despliegue en Dokploy/Coolify; URL pública `https://<dominio>.confianza.pe/remoteEntry.json`
- [ ] **F5-04** · `docker-compose.yml` de desarrollo (front + backend + postgres propio) para probar embebido contra el Host local

---

## ⏳ FASE 6 — Registro y permisos en el MIS (con el equipo del Host) 🔴

- [ ] **F6-01** · Actualizar `federation.manifest.json` del Host (producción) con la URL desplegada
- [ ] **F6-02** · Alta definitiva en `/admin/sistemas` (nombre, slug, descripción, ícono, URL, versión, estado)
- [ ] **F6-03** · Definir la **Estructura** jerárquica (Secciones → Subsecciones → Módulos) en el detalle del sistema
- [ ] **F6-04** · Configurar **permisos por rol a nivel de módulo** (ítem Roles del detalle del sistema)
- [ ] **F6-05** · Habilitar el subsistema en los roles correspondientes (`/admin/roles/:id/editar`) → claim `subsistemas` del JWT
- [ ] **F6-06** 🔴 · Validación final del checklist de integración (doc 02 §6) con el equipo del Host

---

## Resumen de Ruta Crítica

```
FASE 0 (plantilla — HECHA)
   │  clon por subsistema
   ▼
FASE 1 (adopción) ─► FASE 2 (integración temprana con el Host) 🔴
                              │
                              ▼
                      FASE 3 (vistas del dominio) ──► FASE 4 (backend propio)
                                                            │
                                                            ▼
                                          FASE 5 (Docker + despliegue)
                                                            │
                                                            ▼
                                          FASE 6 (registro + permisos en el MIS)
```

---

## Criterios de Aceptación vs. Fases

| Criterio (doc 01) | Fase | Verificación |
|---|---|---|
| CA-P01: build genera `remoteEntry.json` | 0 / 1 | `npm run build` |
| CA-P02: carga sin recarga del navegador | 2 | F2-03 |
| CA-P03: solo área de contenido | 2 / 3 | Revisión visual embebido |
| CA-P04: solo lectura del contrato | 2 / 3 | F2-05 + revisión de código |
| CA-P05: MisTheme + tokens | 3 | Revisión visual vs. Host |
| CA-P06: deep-linking | 2 / 3 | F2-06 |
| CA-P07: desarrollo aislado | 1 | F1-05 |
| CA-P08: sin `zone.js` | 0 / 1 | Inspección del bundle |

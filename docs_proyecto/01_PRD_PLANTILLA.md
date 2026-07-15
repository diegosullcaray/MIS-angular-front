# 01 — PRD de la Plantilla de Sistema Hijo (Remote)
> **Proyecto:** MIS - Management Information System — Plantilla base de sistema hijo (frontend)  
> **Documentación Activa:** [01_PRD_PLANTILLA](./01_PRD_PLANTILLA.md) | [02_INDICACIONES_Y_RESTRICCIONES](./02_INDICACIONES_Y_RESTRICCIONES.md) | [03_IMPLEMENTATION_PLAN](./03_IMPLEMENTATION_PLAN.md)  
> **Documentación del Host (referencia obligatoria):** `MIS-angular-front/docs_proyecto/` — en especial **08_GUIA_SISTEMAS_HIJOS**  
> **Versión:** 1.0.0  
> **Fecha:** 2026-07-14  
> **Estado:** 🟢 Aprobado

---

## 1. Propósito

Este repositorio es la **plantilla oficial del frontend de un sistema hijo (Remote)** del
MIS. Todo subsistema nuevo (Reportes, Contabilidad, RRHH, Ventas, Logística…) **se inicia
clonando esta plantilla**, garantizando desde el día 1:

- Integración correcta con el Host mediante **Native Federation** (expone `./Component`).
- Cumplimiento de las **reglas no negociables** del MIS (RN-01..RN-06, PG-06).
- Identidad visual idéntica al Host (**MisTheme** + tokens `--mis-*` + Tailwind v4).
- Lectura segura del **contrato de la shell** (usuario, rol, subsistemas, JWT) sin mutarlo.
- Base técnica alineada: Angular 22 **Zoneless**, Signal Forms, versiones sincronizadas.

> La plantilla cubre **únicamente el frontend** del sistema hijo. El backend propio
> (Spring Boot + BD independiente) se rige por la guía 08 §5 del Host y queda fuera
> del alcance de este repositorio.

---

## 2. Contexto: qué es un sistema hijo

Un sistema hijo es una aplicación **independiente** (repositorio, equipo, despliegue y
base de datos propios) que el Host embebe en tiempo de ejecución con `loadRemoteModule`
(nunca iframes). El Host es dueño del marco visual (header, sidebar, breadcrumb, URL
base) y de la autenticación MFA; el hijo solo renderiza su **área de contenido**.

```
Navegador ──► MIS HOST (shell) ── /subsistema-<dominio>/** ── RemoteWrapper
                                                                  │ loadRemoteModule
                                                                  ▼
                                              ESTE REPO (frontend del hijo)
                                              expone './Component' (remote-root)
```

---

## 3. Alcance de la plantilla

### ✅ Dentro del alcance

- **Workspace Angular 22 Zoneless** listo: sin `zone.js`, `provideZonelessChangeDetection()`, `strict`.
- **Native Federation como Remote**: `federation.config.mjs` con `name` = slug y `exposes './Component'`.
- **Componente raíz expuesto** (`remote-root.component.ts`, export `default`) con:
  - Lectura de la URL profunda para decidir la vista inicial (deep-linking `/{slug}/**`).
  - Navegación interna por signals + `router.navigate` a subrutas del slug.
- **Design system del Host**: copia de `mis-theme.ts` y `tokens.css` + Tailwind v4 + PrimeNG sin ripple.
- **Contrato de la shell** (`core/shell-contract/`): signals de solo lectura (`usuarioActivo`,
  `esAdmin`, `esAdminSistema`, `subsistemas`, `tieneAccesoPropio`) + JWT del Host.
- **Interceptor de autenticación** que adjunta el JWT del Host al backend PROPIO.
- **2 vistas de ejemplo** (dashboard + tabla/Signal Form) con los patrones de UI del MIS,
  pensadas para ser reemplazadas por las vistas reales del dominio.
- **Dockerfile + nginx.conf** con CORS habilitado para servir `remoteEntry.json` al Host.
- **Modo standalone de desarrollo**: `npm start` levanta el remote aislado en su puerto.

### ❌ Fuera del alcance

- Backend del subsistema (Spring Boot, BD propia, validación del JWT) — guía 08 §5.
- Autenticación propia: el hijo **nunca** implementa login; la sesión la emite el Host.
- Header, sidebar, breadcrumb o cualquier chrome de navegación (RN-01).
- Registro en el Host (manifest + Gestión de Sistemas): lo ejecuta un `admin-sistema`
  siguiendo la guía 08 §6, una vez desplegado el hijo.

---

## 4. Usuarios de esta plantilla

| Perfil | Uso |
|---|---|
| **Equipo de un subsistema** | Clona la plantilla, renombra el slug y desarrolla las vistas de su dominio. |
| **Equipo del Host** | Mantiene la plantilla sincronizada con el Host (versiones, tema, contrato). |
| **Admin Sistema (MIS)** | Registra el remote resultante en `/admin/sistemas` y asigna permisos por rol. |

---

## 5. Criterios de aceptación de la plantilla

| # | Criterio | Prioridad |
|---|---|:---:|
| CA-P01 | `npm run build` genera `remoteEntry.json` + chunks federados sin errores. | 🔴 Crítica |
| CA-P02 | El Host carga el remote vía `loadRemoteModule` sin recargar el navegador (RN-05). | 🔴 Crítica |
| CA-P03 | El componente expuesto renderiza solo área de contenido (sin chrome propio). | 🔴 Crítica |
| CA-P04 | El remote lee usuario/rol/subsistemas de la shell y **no muta** su estado. | 🔴 Crítica |
| CA-P05 | La UI usa MisTheme + tokens `--mis-*`; visualmente indistinguible del Host. | 🟠 Alta |
| CA-P06 | Deep-link `/{slug}/<vista>` abre la vista interna correcta. | 🟠 Alta |
| CA-P07 | `npm start` permite desarrollo aislado sin el Host levantado. | 🟡 Media |
| CA-P08 | El bundle no contiene `zone.js`. | 🔴 Crítica |

---

## 6. Cómo usar la plantilla (resumen operativo)

1. **Clonar** este repo con el nombre del subsistema (`mis-remote-<dominio>`).
2. **Renombrar el slug** `subsistema-plantilla` → `subsistema-<dominio>` en:
   - `federation.config.mjs` (`name`)
   - `src/app/core/shell-contract/shell-contract.service.ts` (`SLUG_SUBSISTEMA`)
3. **Asignar el puerto** de desarrollo según la convención de la guía 08 §3
   (`angular.json` → `serve.options.port` y `serve-original.options.port`).
4. Reemplazar las vistas de `pages/` por las del dominio (ver plan en doc 03).
5. Desarrollar contra el backend propio (`/api/<dominio>/v1/*`).
6. Dockerizar, desplegar y **registrar** en el Host (manifest + `/admin/sistemas`).

El detalle paso a paso, con fases y checklists, está en
[03_IMPLEMENTATION_PLAN](./03_IMPLEMENTATION_PLAN.md); las reglas obligatorias en
[02_INDICACIONES_Y_RESTRICCIONES](./02_INDICACIONES_Y_RESTRICCIONES.md).

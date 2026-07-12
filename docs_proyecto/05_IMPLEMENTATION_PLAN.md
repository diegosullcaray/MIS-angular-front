# 05 — Implementation Plan (Ruta Crítica)
> **Proyecto:** MIS - Management Information System  
> **Documentación Activa:** [01_PRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/01_PRD.md) | [02_UI_UX_APP_FLOW](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/02_UI_UX_APP_FLOW.md) | [03_TRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/03_TRD.md) | [04_BACKEND_SCHEMA](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/04_BACKEND_SCHEMA.md) | [05_IMPLEMENTATION_PLAN](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/05_IMPLEMENTATION_PLAN.md) | [06_FIGMA_UX_KIT](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/06_FIGMA_UX_KIT.html)  
> **Versión:** 1.0.0  
> **Fecha:** 2026-07-09  
> **Estado:** 🟡 Pendiente de aprobación

---

## Resumen Ejecutivo

Plan de ruta crítica para la construcción del **MIS Host**: un shell Angular 21/22 Zoneless con Native Federation que centraliza la navegación, embebe subsistemas Remotes de forma dinámica y gestiona usuarios, roles y permisos de acceso a través de un módulo IAM interno. El plan está organizado en **7 fases secuenciales** que respetan las dependencias entre capas de la arquitectura.

---

## Convenciones de este Documento

| Símbolo | Significado |
|---|---|
| `[ ]` | Tarea pendiente |
| `[/]` | Tarea en progreso |
| `[x]` | Tarea completada |
| 🔴 | Tarea bloqueante (no continuar sin completar) |
| 🟠 | Alta prioridad |
| 🟡 | Prioridad media |

---

## FASE 0 — Scaffolding y Configuración Base 🔴

> **Objetivo:** Tener el proyecto Angular corriendo en modo Zoneless con Native Federation configurado como Host.

- [ ] **F0-01** · Crear workspace Angular 22 con Angular CLI
  ```bash
  npx -y @angular/cli@latest new mis-host --standalone --style=scss --routing=false --skip-git
  ```
- [ ] **F0-02** · Instalar `@angular-architects/native-federation`
  ```bash
  npm install @angular-architects/native-federation
  npx ng add @angular-architects/native-federation --type=host --port=4200
  ```
- [ ] **F0-03** · **Eliminar `zone.js`** de `angular.json` (key `polyfills`) y de `package.json`
- [ ] **F0-04** · Configurar `provideExperimentalZonelessChangeDetection()` en `src/app/app.config.ts`
- [ ] **F0-05** · Crear `public/federation.manifest.json` con al menos un Remote de placeholder
- [ ] **F0-06** · Verificar que `npm run start` levanta el Host en `localhost:4200` sin errores de consola

**Archivos modificados/creados:**
- `angular.json`
- `federation.config.js`
- `public/federation.manifest.json`
- `src/app/app.config.ts`
- `src/main.ts`
- `package.json`

---

## FASE 1 — Core Layout (Shell) 🔴

> **Objetivo:** Tener el marco visual (`ShellLayoutComponent`, `HeaderComponent`, `SidebarComponent`) funcionando con rutas base.

- [ ] **F1-01** · Crear `src/app/app.routes.ts` con la ruta raíz y redirect
  ```
  /admin  →  redirect → /admin/dashboard
  **      →  NotFoundComponent (lazy)
  ```
- [ ] **F1-02** · Crear `ShellLayoutComponent` (Standalone)
  - Archivo: `src/app/core/layout/shell-layout/shell-layout.component.ts`
  - Template: sidebar + header + `<router-outlet>`
  - Importa: `RouterOutlet`, `SidebarComponent`, `HeaderComponent`

- [ ] **F1-03** · Crear `HeaderComponent` (Standalone, Dumb)
  - Archivo: `src/app/core/layout/header/header.component.ts`
  - Inputs: `titulo: string`, `usuario: UsuarioActivo | null`
  - Estilos: `header.component.scss`

- [ ] **F1-04** · Crear `SidebarComponent` (Standalone, Smart)
  - Archivo: `src/app/core/layout/sidebar/sidebar.component.ts`
  - Inyecta: `ShellStateService` (lee `menuItemActivo`)
  - Lee el menú de navegación desde un Signal del servicio
  - Emite evento al `ShellStateService` al seleccionar un ítem

- [ ] **F1-05** · Registrar `ShellLayoutComponent` como layout en `app.routes.ts` usando el patrón de ruta padre con children:
  ```typescript
  {
    path: 'admin',
    component: ShellLayoutComponent,
    children: [...]
  }
  ```

- [ ] **F1-06** · Crear `DashboardComponent` (Standalone, Smart) como vista inicial
  - Archivo: `src/app/features/dashboard/dashboard.component.ts`
  - Lazy loaded en `/admin/dashboard`

- [ ] **F1-07** · Crear `NotFoundComponent` (Standalone, Dumb)
  - Archivo: `src/app/shared/ui/not-found/not-found.component.ts`

- [ ] **F1-08** · Verificar navegación básica: `/admin` → `/admin/dashboard` → Shell visible

**Archivos creados:**
- `src/app/app.routes.ts`
- `src/app/core/layout/shell-layout/shell-layout.component.ts`
- `src/app/core/layout/shell-layout/shell-layout.component.scss`
- `src/app/core/layout/header/header.component.ts`
- `src/app/core/layout/header/header.component.scss`
- `src/app/core/layout/sidebar/sidebar.component.ts`
- `src/app/core/layout/sidebar/sidebar.component.scss`
- `src/app/features/dashboard/dashboard.component.ts`
- `src/app/shared/ui/not-found/not-found.component.ts`

---

## FASE 2 — ShellStateService (Estado Global con Signals) 🔴

> **Objetivo:** Implementar el servicio Singleton que actúa como contrato de comunicación Host ↔ Remote.

- [ ] **F2-01** · Crear `ShellStateService`
  - Archivo: `src/app/core/services/shell-state.service.ts`
  - Implementar todos los Signals privados y sus `asReadonly()` expuestos
  - Signals: `_usuarioActivo`, `_menuItemActivo`, `_catalogoActivo`
  - Computed: `esAdmin`
  - Métodos: `setUsuarioActivo()`, `setMenuItemActivo()`, `setCatalogoActivo()`
  - Decorador: `@Injectable({ providedIn: 'root' })`

- [ ] **F2-02** · Crear interfaces en `src/app/core/services/shell-state.model.ts`
  - `UsuarioActivo`, `MenuItemActivo`

- [ ] **F2-03** · Inyectar `ShellStateService` en `SidebarComponent` para lectura del ítem activo

- [ ] **F2-04** · Inicializar un usuario de prueba desde `AppComponent.ngOnInit()` usando `setUsuarioActivo()`

- [ ] **F2-05** · Verificar que `esAdmin` y `esAdminSistema` computed se actualizan al cambiar el rol del usuario

- [ ] **F2-06** · Crear `role.guard.ts` en `src/app/core/guards/`
  - Implementar `CanActivateFn` que lea `ShellStateService.usuarioActivo()` y compare el rol requerido
  - Si el rol no coincide, redirige a `/admin/dashboard` y opcionalmente emite un Toast de acceso denegado

**Archivos creados:**
- `src/app/core/services/shell-state.service.ts`
- `src/app/core/services/shell-state.model.ts`
- `src/app/core/guards/auth.guard.ts`
- `src/app/core/guards/role.guard.ts`

---

## FASE 3 — Módulo de Gestión de Sistemas Embebidos (MFEs) 🟠

> **Objetivo:** Implementar la administración, registro y parametrización de microfrontends (Sistemas, Estructura de Secciones/Módulos, y matriz de Permisos).

- [ ] **F3-01** · Crear modelos de Sistemas
  - Archivo: `src/app/pages/modules/sistemas/models/sistema.model.ts`
  - Interfaces: `Sistema`, `Seccion`, `Subseccion`, `Modulo`, `PermisoRolSistema`

- [ ] **F3-02** · Crear `SistemasService`
  - Archivo: `src/app/pages/modules/sistemas/services/sistemas.service.ts`
  - Signals: `isLoading`, `error`, `sistemas`
  - Métodos HTTP: `cargarSistemas()`, `obtenerSistema()`, `crearSistema()`, `actualizarSistema()`, `eliminarSistema()`, `guardarEstructura()`, `guardarPermisos()`

- [ ] **F3-03** · Crear `sistemas.routes.ts` con lazy loading interno:
  ```typescript
  // src/app/pages/modules/sistemas/sistemas.routes.ts
  export const SISTEMAS_ROUTES: Routes = [
    { path: '', component: SistemasListComponent },
    { path: 'nuevo', component: SistemaFormComponent },
    { path: ':id', component: SistemaDetalleComponent },
    { path: ':id/editar', component: SistemaFormComponent }
  ];
  ```

- [ ] **F3-04** · Crear `SistemasListComponent` (Standalone, Smart)
  - Archivo: `src/app/pages/modules/sistemas/components/sistemas-list/sistemas-list.component.ts`
  - Muestra la cuadrícula (MFE grid) de 3 columnas de los sistemas embebidos, con botón de edición en el pie de cada tarjeta.

- [ ] **F3-05** · Crear `SistemaFormComponent` (Standalone, Smart)
  - Archivo: `src/app/pages/modules/sistemas/components/sistema-form/sistema-form.component.ts`
  - Formulario estructurado con `SelectButton` (Información de Registro / Configuración de Despliegue).

- [ ] **F3-06** · Crear `SistemaDetalleComponent` (Standalone, Smart)
  - Archivo: `src/app/pages/modules/sistemas/components/sistema-detalle/sistema-detalle.component.ts`
  - Vista de detalles estructurada con `SelectButton` para togglear entre:
    * `Información` (datos del MFE).
    * `Estructura` (árbol jerárquico de secciones y subsecciones).
    * `Permisos` (configuración de permisos CRUD por Rol para cada módulo).

**Archivos creados/modificados:**
- `src/app/pages/modules/sistemas/models/sistema.model.ts`
- `src/app/pages/modules/sistemas/services/sistemas.service.ts`
- `src/app/pages/modules/sistemas/sistemas.routes.ts`
- `src/app/pages/modules/sistemas/components/sistemas-list/`
- `src/app/pages/modules/sistemas/components/sistema-form/`
- `src/app/pages/modules/sistemas/components/sistema-detalle/`

---

## FASE 3B — Feature Accesos / IAM (Módulo Administrador del Sistema) 🔴

> **Objetivo:** Implementar el CRUD completo de Usuarios y Roles, protegido por `roleGuard('admin-sistema')`.
> Depende de FASE 2 (ShellStateService + roleGuard) y puede desarrollarse en paralelo con FASE 4.

- [ ] **F3B-01** · Crear modelos IAM
  - Archivo: `src/app/pages/modules/accesos/models/acceso.model.ts`
  - Tipos: `RolSlug`, `Rol`, `Usuario`, `UsuarioRequest`, `RolRequest`, `PageResponse<T>`

- [ ] **F3B-02** · Crear `AccesosService`
  - Archivo: `src/app/pages/modules/accesos/services/accesos.service.ts`
  - Signals: `isLoading`, `error`, `usuarios`, `roles`
  - Métodos: `cargarUsuarios()`, `crearUsuario()`, `actualizarUsuario()`, `cambiarEstado()`, `cargarRoles()`, `crearRol()`, `actualizarRol()`, `eliminarRol()`

- [ ] **F3B-03** · Crear `accesos.routes.ts` con lazy loading y `roleGuard`:
  ```typescript
  export const ACCESOS_ROUTES: Routes = [
    { path: '', component: AccesosShellComponent },
    { path: 'usuarios', component: UsuariosListComponent },
    { path: 'usuarios/nuevo', component: UsuarioFormComponent },
    { path: 'usuarios/:id', component: UsuarioFormComponent },
    { path: 'roles', component: RolesListComponent },
    { path: 'roles/nuevo', component: RolFormComponent },
    { path: 'roles/:id', component: RolDetalleComponent },
    { path: 'roles/:id/editar', component: RolFormComponent }
  ];
  ```

- [ ] **F3B-04** · Crear `AccesosShellComponent` (Standalone, Smart)
  - Archivo: `src/app/pages/modules/accesos/components/accesos-shell/accesos-shell.component.ts`
  - Dashboard IAM: tarjetas con total usuarios activos, total roles, remotes configurados

- [ ] **F3B-05** · Crear `UsuariosListComponent` (Standalone, Smart)
  - Tabla paginada de usuarios con columnas: Nombre, Email, Rol, Subsistemas, Estado, Acciones
  - Botón "Nuevo Usuario" → navega a `/admin/accesos/usuarios/nuevo`

- [ ] **F3B-06** · Crear `UsuarioFormComponent` (Standalone, Smart)
  - Formulario con: Nombre, Email, Contraseña (opcional), Rol (select), Subsistemas (multi-checkbox)
  - Modo Crear y modo Editar (detectado por presencia de `:id`)

- [ ] **F3B-07** · Crear `RolesListComponent` (Standalone, Smart)
  - Tabla de roles con columnas: Nombre, Slug, Subsistemas habilitados, Acciones

- [ ] **F3B-08** · Crear `RolFormComponent` (Standalone, Smart)
  - Formulario: Nombre, Slug (auto-generado), Subsistemas (multi-checkbox dinámico desde `federation.manifest.json`)

- [ ] **F3B-09** · Crear `ToastComponent` y `AccessDeniedComponent` en `shared/ui`

- [ ] **F3B-10** · Registrar la ruta `/admin/accesos` en `app.routes.ts` con `roleGuard`:
  ```typescript
  {
    path: 'accesos',
    canActivate: [roleGuard('admin-sistema')],
    loadChildren: () => import('./pages/modules/accesos/accesos.routes').then(m => m.ACCESOS_ROUTES)
  }
  ```

- [ ] **F3B-11** · Verificar: solo el usuario con rol `admin-sistema` puede acceder a `/admin/accesos`

**Archivos creados:**
- `src/app/pages/modules/accesos/models/acceso.model.ts`
- `src/app/pages/modules/accesos/services/accesos.service.ts`
- `src/app/pages/modules/accesos/accesos.routes.ts`
- `src/app/pages/modules/accesos/components/accesos-shell/accesos-shell.component.ts`
- `src/app/pages/modules/accesos/components/usuarios/usuarios-list/usuarios-list.component.ts`
- `src/app/pages/modules/accesos/components/usuarios/usuario-form/usuario-form.component.ts`
- `src/app/pages/modules/accesos/components/roles/roles-list/roles-list.component.ts`
- `src/app/pages/modules/accesos/components/roles/rol-form/rol-form.component.ts`
- `src/app/pages/modules/accesos/components/roles/rol-detalle/rol-detalle.component.ts`
- `src/app/shared/ui/toast/toast.component.ts`
- `src/app/shared/ui/access-denied/access-denied.component.ts`

---

## FASE 4 — Native Federation: Carga Dinámica de Remotes 🔴

> **Objetivo:** Implementar `RemoteWrapperComponent` con `@defer`, carga dinámica via `loadRemoteModule`, y manejo de errores elegante.

- [ ] **F4-01** · Crear `RemoteSkeletonComponent` (Standalone, Dumb)
  - Archivo: `src/app/shared/ui/remote-skeleton/remote-skeleton.component.ts`
  - Animación skeleton pulsante (CSS)

- [ ] **F4-02** · Crear `RemoteErrorComponent` (Standalone, Dumb)
  - Archivo: `src/app/shared/ui/remote-error/remote-error.component.ts`
  - Inputs: `subsistema: string`, `motivo?: string`
  - Botón "Reintentar" que emite evento al padre

- [ ] **F4-03** · Crear `RemoteWrapperComponent` (Standalone, Smart)
  - Archivo: `src/app/core/federation/remote-wrapper/remote-wrapper.component.ts`
  - Input: `remoteName: string` (nombre del Remote en el manifest)
  - Lógica:
    1. Al iniciar, llama `loadRemoteModule({ remoteName, exposedModule: './Component' })`
    2. Usa `@defer` para gestionar los 3 estados: loading, error, contenido
    3. En caso de error de red, muestra `RemoteErrorComponent`
    4. Expone `ShellStateService` al contexto (el Remote lo inyecta automáticamente)

- [ ] **F4-04** · Registrar la ruta dinámica en `app.routes.ts`:
  ```typescript
  {
    path: ':subsistema',
    component: RemoteWrapperComponent
  }
  ```

- [ ] **F4-05** · Configurar `initFederation` en `src/main.ts` para cargar el manifest antes del bootstrap:
  ```typescript
  import { initFederation } from '@angular-architects/native-federation';
  initFederation('/federation.manifest.json')
    .then(() => import('./bootstrap'))
    .catch(console.error);
  ```

- [ ] **F4-06** · Crear `src/bootstrap.ts` que invoque `bootstrapApplication` con `appConfig`

- [ ] **F4-07** · Levantar un Remote de prueba local en `localhost:4201` y verificar la carga dinámica desde el Host

- [ ] **F4-08** · Simular fallo del Remote (detener `localhost:4201`) y verificar que `RemoteErrorComponent` se muestra sin romper el Host

**Archivos creados:**
- `src/app/shared/ui/remote-skeleton/remote-skeleton.component.ts`
- `src/app/shared/ui/remote-skeleton/remote-skeleton.component.scss`
- `src/app/shared/ui/remote-error/remote-error.component.ts`
- `src/app/shared/ui/remote-error/remote-error.component.scss`
- `src/app/core/federation/remote-wrapper/remote-wrapper.component.ts`
- `src/main.ts` (modificado)
- `src/bootstrap.ts` (nuevo)

---

## FASE 5 — Shared UI y Polish 🟡

> **Objetivo:** Completar los componentes compartidos restantes y verificar la coherencia visual del sistema.

- [ ] **F5-01** · Crear `InlineErrorComponent` (Standalone, Dumb)
  - Archivo: `src/app/shared/ui/inline-error/inline-error.component.ts`
  - Para errores de API en vistas internas del Host

- [ ] **F5-02** · Crear `ConfirmDialogComponent` (Standalone, Smart)
  - Archivo: `src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts`
  - Usando Angular CDK Dialog o signal-based approach

- [ ] **F5-03** · Implementar estilos globales en `src/styles.scss`
  - Variables CSS (design tokens): colores, tipografía, espaciado, sombras
  - Clases utilitarias base: `.skeleton-pulse`, `.error-state`, `.empty-state`

- [ ] **F5-04** · Revisar aislamiento de features con análisis estático:
  ```bash
  # Verificar que ningún feature importa directamente de otro feature
  grep -r "from '../../features/" src/app/features/
  ```

- [ ] **F5-05** · Ejecutar build de producción y verificar ausencia de `zone.js` en el bundle:
  ```bash
  npm run build
  # Verificar en dist/ que no hay referencia a zone.js
  ```

**Archivos creados/modificados:**
- `src/app/shared/ui/inline-error/inline-error.component.ts`
- `src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts`
- `src/styles.scss`

---

## FASE 6 — Dockerización y CI/CD 🟡

> **Objetivo:** Empaquetar el Host en una imagen Docker lista para despliegue independiente.

- [ ] **F6-01** · Crear `Dockerfile` en la raíz del Host
  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  FROM nginx:alpine
  COPY --from=builder /app/dist/nes-host /usr/share/nginx/html
  COPY nginx.conf /etc/nginx/nginx.conf
  EXPOSE 80
  ```

- [ ] **F6-02** · Crear `nginx.conf` optimizado para SPA Angular:
  - Redirige todas las rutas a `index.html`
  - Configura headers de caché para assets estáticos

- [ ] **F6-03** · Crear `.dockerignore`

- [ ] **F6-04** · Crear `docker-compose.yml` para desarrollo local con Host + un Remote de prueba

- [ ] **F6-05** · Verificar build Docker: `docker build -t nes-host:local .`

- [ ] **F6-06** · Configurar pipeline en Dokploy / Coolify apuntando al registry privado

**Archivos creados:**
- `Dockerfile`
- `nginx.conf`
- `.dockerignore`
- `docker-compose.yml`

---

## Resumen de Ruta Crítica

FASE 0 (Scaffolding)
    ↓ [BLOQUEANTE]
FASE 1 (Core Layout)
    ↓ [BLOQUEANTE]
FASE 2 (ShellStateService + Guards)
    ↓
    ├─ FASE 3A (Feature Catálogos) ──────────────┐
    │                                              │
    ├─ FASE 3B (Feature Accesos / IAM) ────────┐  │
    │                                          │  │
    └─ FASE 4 (Native Federation) ────────────┘  │
                                                   │
                                           FASE 5 (Polish)
                                                   │
                                           FASE 6 (Docker)

> Las FASES 3A, 3B y 4 pueden desarrollarse en paralelo por equipos distintos, siempre que la FASE 2 esté completa.

---

## Criterios de Aceptación vs. Fases

| Criterio | Fase que lo cubre |
|---|---|
| CA-01: Carga dinámica de Remote sin reload | FASE 4 |
| CA-02: Sin iframes | FASE 4 (loadRemoteModule) |
| CA-03: Sin conflictos de rendimiento | FASE 0 (Zoneless) + FASE 4 |
| CA-04: Error elegante cuando Remote cae | FASE 4 — F4-08 |
| CA-05: Skeleton mientras Remote carga | FASE 4 — F4-03 |
| CA-06: CRUD de Catálogos vía API REST | FASE 3A |
| CA-07: CRUD de Usuarios y Roles (IAM) solo para Admin Sistema | FASE 3B |
| CA-08: `roleGuard` bloquea acceso a `/admin/accesos` para otros roles | FASE 2 — F2-06 + FASE 3B — F3B-11 |

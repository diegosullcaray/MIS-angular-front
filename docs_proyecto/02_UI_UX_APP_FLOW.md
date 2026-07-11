# 02 — UI/UX App Flow (Frontend y Componentes)
> **Proyecto:** MIS - Management Information System  
> **Documentación Activa:** [01_PRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/01_PRD.md) | [02_UI_UX_APP_FLOW](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/02_UI_UX_APP_FLOW.md) | [03_TRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/03_TRD.md) | [04_BACKEND_SCHEMA](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/04_BACKEND_SCHEMA.md) | [05_IMPLEMENTATION_PLAN](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/05_IMPLEMENTATION_PLAN.md) | [06_FIGMA_UX_KIT](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/06_FIGMA_UX_KIT.html)  
> **Versión:** 1.0.0  
> **Fecha:** 2026-07-09  
> **Estado:** 🟡 En revisión

---

## 1. Mapa de Rutas (`app.routes.ts`)

El Host maneja el enrutamiento base. Las rutas se dividen en dos familias:

### 1.1 Rutas Internas del Host

| Ruta | Componente Cargado | Lazy Load | Guard | Acceso |
|---|---|---|---|---|
| `/admin` | Redirect → `/admin/dashboard` | — | `authGuard` | Todos |
| `/admin/dashboard` | `DashboardComponent` | ✅ | `authGuard` | Todos |
| `/admin/catalogos` | `CatalogosShellComponent` | ✅ | `authGuard` | Admin Sistema, Admin General |
| `/admin/catalogos/:tipo` | `CatalogoDetalleComponent` | ✅ | `authGuard` | Admin Sistema, Admin General |
| `/admin/accesos` | `AccesosShellComponent` | ✅ | `authGuard` + `roleGuard('admin-sistema')` | Admin Sistema ┌️ EXCLUSIVO |
| `/admin/accesos/usuarios` | `UsuariosListComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/usuarios/:id` | `UsuarioFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/roles` | `RolesListComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/roles/:id` | `RolFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `**` | `NotFoundComponent` | ✅ | — | — |

### 1.2 Rutas Dinámicas hacia Remotes (Native Federation)

| Ruta | Remote Target | Carga |
|---|---|---|
| `/admin/:nombre-subsistema` | `loadRemoteModule(...)` | Dinámica vía `federation.manifest.json` |

> **Regla RN-01**: El Host posee y controla la URL base `/admin/`. Ningún Remote puede registrar rutas fuera de su segmento asignado.

---

## 2. Arquitectura de Componentes del Host

### 2.1 Árbol de Componentes (Standalone)

```
AppComponent (root — Standalone, Zoneless)
└── ShellLayoutComponent (Standalone) ← 100% responsable del marco visual
    ├── HeaderComponent (Standalone, Dumb)
    ├── SidebarComponent (Standalone, Smart — lee menú + permisos desde ShellStateService)
    └── <router-outlet>
        ├── [Vistas internas del Host]
        │   ├── DashboardComponent (Standalone, Smart)
        │   ├── CatalogosShellComponent (Standalone, Smart)
        │   ├── CatalogoDetalleComponent (Standalone, Smart)
        │   └── [Módulo IAM — solo Admin Sistema]
        │       ├── AccesosShellComponent (Standalone, Smart)
        │       ├── UsuariosListComponent (Standalone, Smart)
        │       ├── UsuarioFormComponent (Standalone, Smart)
        │       ├── RolesListComponent (Standalone, Smart)
        │       └── RolFormComponent (Standalone, Smart)
        └── [Micro-frontend Remote]
            └── RemoteWrapperComponent (Standalone, Smart)
                ├── @defer (loading) → RemoteSkeletonComponent
                ├── @defer (error)   → RemoteErrorComponent
                └── @defer (main)    → <componente-remoto-inyectado>
```

### 2.2 Descripción de Componentes

#### `ShellLayoutComponent` — Smart / Host
- **Tipo:** Standalone (`standalone: true`)
- **Responsabilidad:** Contiene el sidebar, el header y el `<router-outlet>` central.
- **Regla crítica:** Es el único componente que puede modificar el layout global. Los Remotes no tienen acceso a él.
- **Ubicación:** `src/app/core/layout/shell-layout/shell-layout.component.ts`

#### `HeaderComponent` — Dumb
- **Tipo:** Standalone
- **Responsabilidad:** Muestra el nombre del sistema, logo y acciones de usuario (perfil, cerrar sesión).
- **Inputs:** `@Input() titulo: string`, `@Input() usuario: UsuarioActivo`
- **Ubicación:** `src/app/core/layout/header/header.component.ts`

#### `SidebarComponent` — Smart
- **Tipo:** Standalone
- **Responsabilidad:** Renderiza una tira vertical de íconos (estilo macOS/Gmail — Col 1). Cada ícono representa un **sistema**: el primero es siempre el ícono **Inicio** del Host, y los demás son los sistemas embebidos (Remotes) asignados al usuario. **Perfil y Cerrar sesión NO están aquí** — viven en el menú desplegable del usuario en el header.
- **Inyecta:** `ShellStateService` (roles, subsistemas habilitados, ítem activo)
- **Ubicación:** `src/app/core/layout/sidebar/sidebar.component.ts`
- **Comportamiento click — Inicio:** Actualiza Col 2 con las rutas del Host filtradas por rol. Si el usuario NO es admin, Col 2 solo muestra «Dashboard». Si es admin, muestra también secciones de administración.
- **Comportamiento click — Sistemas embebidos:** Actualiza Col 2 con las rutas internas del Remote seleccionado (leídas del `navPanel` del manifest).

#### `SidebarNavPanelComponent` — Smart
- **Tipo:** Standalone
- **Responsabilidad:** Panel de navegación secundario **persistente** (columna 2 del layout, ~260px). Su contenido cambia dinámicamente según el ícono activo/seleccionado en la columna 1. Para el ícono **Inicio** (solo admins), muestra las rutas de administración del Host con secciones y acciones. Para los íconos de sistemas embebidos, muestra el nombre del Remote, sus secciones de navegación y el listado de rutas internas. Nunca desaparece del layout — siempre ocupa la columna 2.
- **Inputs:** `@Input() panelActivo: SidebarNavPanelConfig` (tipo, ícono, título, secciones de rutas)
- **Output:** `@Output() rutaSeleccionada: EventEmitter<string>`
- **Ubicación:** `src/app/core/layout/sidebar/sidebar-nav-panel/sidebar-nav-panel.component.ts`

#### `RemoteWrapperComponent` — Smart
- **Tipo:** Standalone
- **Responsabilidad:** Orquesta la carga de un Remote con `loadRemoteModule`. Gestiona los 3 estados con `@defer`: loading skeleton, error, y contenido cargado.
- **Ubicación:** `src/app/core/federation/remote-wrapper/remote-wrapper.component.ts`

#### `RemoteSkeletonComponent` — Dumb
- **Tipo:** Standalone
- **Responsabilidad:** Placeholder visual (skeleton animado) mientras el Remote hydrata.
- **Ubicación:** `src/app/shared/ui/remote-skeleton/remote-skeleton.component.ts`

#### `RemoteErrorComponent` — Dumb
- **Tipo:** Standalone
- **Responsabilidad:** Mensaje de error elegante cuando el contenedor del Remote no está disponible en la red.
- **Inputs:** `@Input() subsistema: string`, `@Input() motivo?: string`
- **Ubicación:** `src/app/shared/ui/remote-error/remote-error.component.ts`

#### `AccesosShellComponent` — Smart (IAM)
- **Tipo:** Standalone
- **Responsabilidad:** Vista de entrada al módulo de Gestión de Accesos. Muestra resumen de usuarios activos, roles definidos y subsistemas configurados.
- **Guard:** `roleGuard('admin-sistema')` — solo visible para Administrador del Sistema.
- **Ubicación:** `src/app/features/accesos/components/accesos-shell/accesos-shell.component.ts`

#### `UsuariosListComponent` / `UsuarioFormComponent` — Smart (IAM)
- **Tipo:** Standalone
- **Responsabilidad:** CRUD completo de usuarios del sistema. El formulario permite asignar rol y subsistemas habilitados.
- **Ubicación:** `src/app/features/accesos/components/usuarios/`

#### `RolesListComponent` / `RolFormComponent` — Smart (IAM)
- **Tipo:** Standalone
- **Responsabilidad:** Gestión de roles y asignación de subsistemas (Remotes) permitidos por rol.
- **Ubicación:** `src/app/features/accesos/components/roles/`

---

### 2.3 Diseño del Sidebar (Estilo Gmail — Dos Columnas)

El sidebar replica **exactamente** el patrón de dos columnas de Gmail:

| Columna | Ancho | Contenido | Comportamiento |
|---|---|---|---|
| **Col 1 — Tira de íconos** | ~56px fija | Ícono + etiqueta corta debajo | Siempre visible. Click en ícono activa Col 2. |
| **Col 2 — Panel de navegación** | ~260px | Navegación interna del sistema activo | Persistente. Cambia contenido según ícono activo. |

- La **Col 1** nunca desaparece.
- La **Col 2** nunca desaparece — solo cambia su contenido cuando el usuario hace click en un ícono distinto.
- No existe flyout flotante que aparezca/desaparezca. El panel es siempre visible y fijo en el layout.
- **Primer ícono (siempre fijo):** [home] Inicio → sistema principal (Host)
- **Íconos intermedios (dinámicos):** uno por cada sistema embebido asignado al usuario
- **Zona inferior (Col 1):** vacía — **sin** ícono de Perfil ni Cerrar sesión

> **Regla de diseño macOS:** Perfil y Cerrar sesión se acceden exclusivamente desde el **menú desplegable del usuario en el Header** (ícono de avatar + nombre + chevron). El sidebar queda limpio, dedicado 100% a la navegación entre sistemas.

#### Estructura Visual del Sidebar — Dos Columnas (macOS)

```
 COL 1 (~56px)    COL 2 (~260px)          ZONA PRINCIPAL
 ┌──────────┐    ┌──────────────────────┐  ┌────────────────────────────────────┐
 │  [Logo]  │    │                      │  │ [MIS] | Dashboard     [DS ▾]       │ ← Header (glass)
 │  MIS     │    │  [Panel dinámico]    │  │  Avatar + Nombre + Chevron         │
 ├──────────┤    │  cambia según ícono  │  │  Click → dropdown: Perfil / Salir  │
 │          │    │  activo en Col 1     │  ├────────────────────────────────────┤
 │ [inicio] │◄── │                      │  │                                    │
 │ Inicio   │    │  ─ Inicio (admin) ── │  │  <router-outlet>                   │
 │ [activo] │    │  · Dashboard         │  │                                    │
 ├──────────┤    │  · Catálogos         │  │                                    │
 │ [chart]  │    │  · Usuarios [Admin]  │  └────────────────────────────────────┘
 │  Conta.  │    │  · Roles    [Admin]  │
 ├──────────┤    │                      │
 │ [users]  │    │  ─ Contabilidad ──── │
 │  RRHH    │    │  · Dashboard         │
 ├──────────┤    │  · Asientos          │
 │ [pulse]  │    │  · Balances          │
 │  Ventas  │    │  · Reportes          │
 ├──────────┤    │  · Parámetros        │
 │ [truck]  │    │                      │
 │  Logíst. │    └──────────────────────┘
 ├──────────┤
 │  (↕ scroll si hay muchos sistemas)
 │          │
 │          │   ← Col 1 termina aquí.
 └──────────┘     NO hay Perfil ni Salir.
                  Esas acciones van en el
                  menú del header [DS ▾].
```

> **Analogía exacta con Gmail:** Col 1 = [Mail | Chat | Meet]. Al click en "Chat", Col 2 muestra toda la navegación de Chat (Nuevo chat, Accesos directos, Mensajes directos...). En MIS: Col 1 = íconos de sistemas, Col 2 = navegación interna del sistema activo. **Col 2 nunca desaparece — solo cambia contenido.**

#### Comportamiento del Panel (Col 2) según ícono activo

**Caso A — Ícono 🏠 Inicio — Usuario ES admin:**
```
┌──────────────────────────────────────────────────┐
│  🏠  Sistema Principal (MIS)                      │
├──────────────────────────────────────────────────┤
│  ▸ Acceso directo                                 │
│    Dashboard                → /admin/dashboard    │
├──────────────────────────────────────────────────┤
│  ▸ Administración           [Admin General+]      │
│    Catálogos                → /admin/catalogos    │
├──────────────────────────────────────────────────┤
│  ▸ Accesos                  [Admin Sistema]       │
│    Usuarios                 → /admin/accesos/us   │
│    Roles                    → /admin/accesos/ro   │
└──────────────────────────────────────────────────┘
```

**Caso B — Ícono 🏠 Inicio — Usuario NO es admin:**
```
┌──────────────────────────────────────────────────┐
│  🏠  Sistema Principal (MIS)                      │
├──────────────────────────────────────────────────┤
│  ▸ Acceso directo                                 │
│    Dashboard                → /admin/dashboard    │
└──────────────────────────────────────────────────┘
   (Sin secciones de administración — rol sin permisos)
```

**Caso C — Ícono de sistema embebido (Remote):**
```
┌──────────────────────────────────────────────────┐
│  📈  Contabilidad                                 │
├──────────────────────────────────────────────────┤
│  ▸ Acceso directo                                 │
│    Dashboard         → /admin/contabilidad/dash   │
├──────────────────────────────────────────────────┤
│  ▸ Contabilidad                                   │
│    Asientos          → /admin/contabilidad/asie   │
│    Balances          → /admin/contabilidad/bala   │
│    Reportes          → /admin/contabilidad/repo   │
├──────────────────────────────────────────────────┤
│  ▸ Configuración                                  │
│    Parámetros        → /admin/contabilidad/conf   │
└──────────────────────────────────────────────────┘
   (Secciones definidas en el manifest del Remote)
```


#### Reglas de Comportamiento del Sidebar

| Regla | Descripción |
|---|---|
| **SB-01** | El ícono **Inicio** es el **primero siempre** en Col 1, visible para todos los roles. No puede ocultarse ni reordenarse. |
| **SB-02** | La **Col 2 (panel secundario) siempre está visible** — nunca desaparece del layout. Solo cambia su contenido al hacer click en otro ícono de Col 1. |
| **SB-03** | El panel de Inicio muestra **solo las secciones permitidas al rol** del usuario. Si no es admin, solo ve «Acceso directo → Dashboard». Si es admin, ve además las secciones de administración filtradas por rol. |
| **SB-04** | Los íconos de sistemas embebidos se generan dinámicamente desde `ShellStateService.subsistemas()` — computed de los Remotes asignados al usuario. |
| **SB-05** | Las secciones y rutas de Col 2 para cada Remote se leen del campo `navPanel` del manifest del Remote en `federation.manifest.json`. |
| **SB-06** | Al hacer click en una ruta de Col 2, el Router navega al destino. El ícono correspondiente en Col 1 queda en estado `activo` (resaltado visual). |
| **SB-07** | El ícono activo en Col 1 recibe una clase CSS `active` con indicador visual (fondo redondeado, borde izquierdo de color acento). |
| **SB-08** | **Perfil y Cerrar sesión NO están en Col 1.** Se acceden desde el menú desplegable del avatar de usuario en el **Header**. Col 1 queda dedicada exclusivamente a la navegación entre sistemas. |
| **SB-09** | Si hay muchos sistemas embebidos, la zona de íconos de Col 1 tiene `overflow-y: auto` con scroll vertical interno. |
| **SB-10** | Si Col 2 tiene muchas rutas/secciones, también tiene scroll vertical interno con `overflow-y: auto`. |
| **SB-11** | No existe flyout flotante. Col 2 es un panel fijo del layout (`width: 220px` fijo en el grid del ShellLayout). |
| **HD-01** | El **Header** muestra: logo/wordmark + separador + breadcrumb de contexto + **pill de usuario** (avatar + nombre + chevron). |
| **HD-02** | Al hacer click en el pill de usuario se despliega un **dropdown** con: nombre completo, email, «Mi perfil», «Preferencias», separador, «Cerrar sesión». |
| **HD-03** | Iconos del sistema son SVG inline estilo Lucide (stroke, sin relleno). Nunca emojis Unicode en la interfaz de navegación. |

#### Modelo de Datos del Sidebar

```typescript
// src/app/core/layout/sidebar/sidebar.model.ts

/** Tipo de ícono en Col 1 */
export type SidebarIconType = 'host-inicio' | 'remote' | 'perfil' | 'salir';

/** Ícono en la Col 1 (tira de íconos) */
export interface SidebarIcon {
  id: string;
  tipo: SidebarIconType;
  icono: string;              // Nombre del ícono Material / SVG
  etiqueta: string;           // Label corto debajo del ícono (ej: 'Inicio', 'Conta.')
  tienePanel: boolean;        // Si actualiza Col 2 al hacer click
  accionDirecta?: () => void; // Para íconos sin panel (Perfil, Cerrar sesión)
}

/** Configuración del panel secundario (Col 2) */
export interface SidebarNavPanelConfig {
  tipo: 'host-admin' | 'host-usuario' | 'remote';
  titulo: string;             // Nombre del sistema (ej: 'Sistema Principal', 'Contabilidad')
  icono: string;
  secciones: SidebarNavSeccion[];
}

/** Sección dentro del panel secundario (como en Gmail: 'Accesos directos', 'Mensajes directos') */
export interface SidebarNavSeccion {
  titulo?: string;            // Título de sección (ej: 'Administración', 'Accesos')
  rutas: SidebarNavRuta[];
}

export interface SidebarNavRuta {
  etiqueta: string;           // Ej: 'Dashboard', 'Asientos', 'Accesos'
  ruta: string;               // Ruta Angular completa
  icono?: string;
  roles?: RolSlug[];          // Si se define, solo aparece para esos roles
}

/** Manifest de un sistema embebido (Remote) */
export interface SubsistemaManifest {
  id: string;                 // Slug del Remote (ej: 'contabilidad')
  nombre: string;             // Nombre legible
  icono: string;
  remoteEntry: string;        // URL al remoteEntry.json
  navPanel: SidebarNavPanelConfig; // Configuración del panel de Col 2 para este Remote
}
```



## 3. Flujo de Navegación

### Flujo Principal (Host → Catálogos internos)

```
Usuario ingresa a /admin
    → authGuard verifica sesión
    → Redirect a /admin/dashboard
    → ShellLayoutComponent renderiza sidebar + header
    → DashboardComponent carga en <router-outlet>
    
Usuario hace click en "Catálogos" en el sidebar
    → Router navega a /admin/catalogos
    → CatalogosShellComponent carga (lazy)
    → Componente consume CatalogosService (HttpClient + Signals)
    → ShellStateService.catalogoActivo actualiza Signal
```

### Flujo de Carga de un Remote

```
Usuario hace click en "Subsistema X" en el sidebar
    → Router navega a /admin/subsistema-x
    → RemoteWrapperComponent inicia
    → @defer muestra RemoteSkeletonComponent (loading state)
    → loadRemoteModule('subsistema-x', ...) ejecuta
        ├── [Éxito] → Componente del Remote se inyecta en el outlet
        └── [Error/Timeout] → RemoteErrorComponent se muestra
    → ShellStateService expone datos del Host al Remote vía Signal asReadonly()
```

### Flujo de Gestión de Accesos (IAM) — solo Administrador del Sistema

```
Admin Sistema hace click en "Accesos" en el sidebar
    → roleGuard verifica rol 'admin-sistema'
        ├── [Autorizado] → Router navega a /admin/accesos
        └── [Sin permiso] → Redirect a /admin/dashboard + toast de error
    → AccesosShellComponent carga (lazy)
    → Muestra resumen: total usuarios, total roles, remotes configurados

Admin Sistema navega a /admin/accesos/usuarios
    → UsuariosListComponent carga lista desde AccesosService
    → Puede crear usuario nuevo → UsuarioFormComponent
        ├── Asigna nombre, email, rol (select)
        └── Asigna subsistemas habilitados (checkboxes por Remote en el manifest)
    → Puede editar o desactivar usuario existente

Admin Sistema navega a /admin/accesos/roles
    → RolesListComponent lista roles disponibles
    → Puede crear/editar rol → RolFormComponent
        └── Asigna nombre del rol + subsistemas (Remotes) habilitados
```

---

## 4. Comportamientos de Estados Asíncronos

| Estado | Mecanismo Angular | Componente UI |
|---|---|---|
| **Loading (Remote)** | `@defer` con `when(isLoading())` | `RemoteSkeletonComponent` |
| **Error (Remote caído)** | `@defer` bloque `@error` | `RemoteErrorComponent` |
| **Datos vacíos (Catálogos / IAM)** | `@if (lista().length === 0)` | `EmptyStateComponent` |
| **Error de API (Catálogos / IAM)** | Signal de error en servicio | `InlineErrorComponent` |
| **Carga de lista (Catálogos / IAM)** | `@defer` con `when` | `ListSkeletonComponent` |
| **Acceso denegado (IAM)** | `roleGuard` falla | Redirect + `ToastComponent` |

---

## 5. Componentes Compartidos (`/src/app/shared/ui`)

| Componente | Tipo | Descripción |
|---|---|---|
| `RemoteSkeletonComponent` | Dumb | Skeleton animado para carga de Remotes |
| `RemoteErrorComponent` | Dumb | Error visual cuando Remote no está disponible |
| `EmptyStateComponent` | Dumb | Ilustración + mensaje para listas vacías |
| `InlineErrorComponent` | Dumb | Error inline para fallos de API |
| `ListSkeletonComponent` | Dumb | Skeleton para listas de catálogos y usuarios |
| `ConfirmDialogComponent` | Smart | Dialog de confirmación reutilizable |
| `ToastComponent` | Dumb | Notificación de éxito / error / acceso denegado |
| `AccessDeniedComponent` | Dumb | Vista de acceso no autorizado (403) |

---

## 6. Wireframe de Layout Completo

```
COL 1 (56px)  COL 2 (220px)          ZONA PRINCIPAL
┌──────┬──────────────────────┬──────────────────────────────────────────────┐
│[logo]│                      │  MIS  |  Dashboard             [DS ▾]        │ ← Header glass
│      │  [panel dinámico]    │                                [avatar+menú]  │
│[home]│                      ├──────────────────────────────────────────────┤
│Inicio│  ── Inicio (admin) ──│                                               │
│      │  · Dashboard         │  <router-outlet>                              │
│[chrt]│  · Catálogos         │  (Vista del Host o RemoteWrapper)             │
│Conta.│  · Usuarios [Admin]  │                                               │
│      │  · Roles    [Admin]  │                                               │
│[usr] │                      │                                               │
│RRHH  │  ── (click en Conta.)│                                               │
│      │  · Dashboard         │                                               │
│[line]│  · Asientos          │                                               │
│Ventas│  · Balances          │                                               │
│      │  · Reportes          │                                               │
│[trck]│  · Parámetros        │                                               │
│Logíst│                      │                                               │
│      │                      │                                               │
│ (↕)  │                      │                                               │
│      │                      │                                               │
│      │                      │                                               │
└──────┴──────────────────────┴──────────────────────────────────────────────┘

Menú de usuario (header — desplegable al click en avatar):
┌────────────────────────────┐
│  Diego Sullcarayra          │
│  diego@confianza.pe         │
├────────────────────────────┤
│  [user]  Mi perfil          │
│  [gear]  Preferencias       │
├────────────────────────────┤
│  [exit]  Cerrar sesión      │ ← SOLO aquí, nunca en el sidebar
└────────────────────────────┘

Leyenda:
  Col 1 = íconos SVG de sistemas (inicio + remotes). Sin Perfil/Salir.
  Col 2 = panel persistente de navegación. Cambia según ícono activo.
  Header= wordmark + breadcrumb + pill usuario (avatar+nombre+chevron)
  (↕)   = zona con scroll si hay muchos sistemas en Col 1
```

### Notas de Implementación del Sidebar

- El sidebar es una **tira angosta de íconos** sin etiquetas de texto visibles (el tooltip aparece al lado al hacer hover lento).
- **No hay modo expandido/colapsado** — el sidebar siempre muestra solo íconos; el flyout es el único mecanismo de navegación hacia subsecciones.
- El flyout se renderiza con `position: fixed` para no quedar recortado por el contenedor del sidebar.
- El ícono activo (sistema cargado actualmente) recibe una clase `active` con resaltado visual (fondo, borde izquierdo o indicador de color).
- La zona de íconos de sistemas embebidos tiene `overflow-y: auto` con scroll suave si el número de sistemas excede el alto disponible.
- El flyout de Inicio se construye de forma estática en el Host; el flyout de cada Remote se construye desde el manifest de ese Remote.

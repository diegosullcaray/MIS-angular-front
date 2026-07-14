# 02 — UI/UX App Flow (Frontend y Componentes)
> **Proyecto:** MIS - Management Information System  
> **Documentación Activa:** [01_PRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/01_PRD.md) | [02_UI_UX_APP_FLOW](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/02_UI_UX_APP_FLOW.md) | [03_TRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/03_TRD.md) | [04_BACKEND_SCHEMA](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/Backend/04_BACKEND_SCHEMA.md) | [05_IMPLEMENTATION_PLAN](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/05_IMPLEMENTATION_PLAN.md) | [06_FIGMA_UX_KIT_GUIDE](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/FIGMA/06_FIGMA_UX_KIT_GUIDE.md) | [08_GUIA_SISTEMAS_HIJOS](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/08_GUIA_SISTEMAS_HIJOS.md)  
> **Versión:** 2.0.0  
> **Fecha:** 2026-07-14  
> **Estado:** 🟢 Aprobado — alineado a la implementación

---

## 1. Estructura de Módulos del Host

La arquitectura del Host se segmenta en exactamente **2 módulos funcionales** dentro del shell:

1. **Módulo Inicio (`/inicio`)**:
   * Panel principal del Host ("Mi espacio" / Dashboard en `/inicio/dashboard`).
2. **Módulo Admin (`/admin` — exclusivo `admin-sistema`)**: agrupa los 3 componentes de gestión, **cada uno con Lista y Detalle**:
   * **Gestión de Sistemas (`/admin/sistemas`)**: registro y configuración de los microfrontends remotos. El detalle tiene los ítems **Detalle General | Estructura | Roles**.
   * **Gestión de Roles (`/admin/roles`)**: definición de perfiles y asignación de sistemas. El detalle tiene los ítems **Detalle General | Usuarios**.
   * **Gestión de Usuarios (`/admin/usuarios`)**: administración de cuentas de la plataforma. El detalle tiene los ítems **Información General | Roles**.

Adicionalmente, fuera de estos 2 módulos, el shell resuelve los **Sistemas Embebidos (`/:remoteName`)**: envoltorio y cargador dinámico (`RemoteWrapperComponent`) en `core/federation/` que inyecta en tiempo de ejecución los microfrontends remotos (Contabilidad, RRHH, Ventas, Logística).

---

## 2. Mapa de Rutas Real (`app.routes.ts`)

### 2.1 Rutas Internas de la Aplicación

| Ruta | Componente Cargado | Lazy Load | Guard | Acceso / Propósito |
|---|---|---|---|---|
| `/login` | `LoginComponent` | ✅ | — | Autenticación en **2 pasos dentro del mismo componente**: credenciales (Signal Forms) → verificación OTP de 6 dígitos con expiración 03:00 |
| `/` | Redirect → `/inicio/dashboard` | — | `authGuard` | Todos |
| `/inicio` | Redirect → `/inicio/dashboard` | — | `authGuard` | Todos |
| `/inicio/dashboard` | `InicioComponent` | ✅ | `authGuard` | Todos (Etiqueta: "Mi espacio") |
| `/admin` | Redirect → `/admin/sistemas` | — | `authGuard` + `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/sistemas` | `SistemasListComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema (lista de Gestión de Sistemas) |
| `/admin/sistemas/nuevo` | `SistemaFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/sistemas/:id` | `SistemaDetalleComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema (detalle: Detalle General / Estructura / Roles) |
| `/admin/sistemas/:id/editar` | `SistemaFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/roles` | `RolesListComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema (lista de Gestión de Roles) |
| `/admin/roles/nuevo` | `RolFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/roles/:id` | `RolDetalleComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema (detalle: Detalle General / Usuarios) |
| `/admin/roles/:id/editar` | `RolFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/usuarios` | `UsuariosListComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema (lista de Gestión de Usuarios) |
| `/admin/usuarios/nuevo` | `UsuarioFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/usuarios/:id` | `UsuarioDetalleComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema (detalle: Información General / Roles) |
| `/admin/usuarios/:id/editar` | `UsuarioFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/:remoteName/**` | `RemoteWrapperComponent` | ✅ | `authGuard` | Carga de Sistemas Embebidos con **deep-linking**: la ruta es componentless con hijo comodín, cualquier subruta del slug carga el remote (que lee la URL para su vista inicial) |
| `**` | `NotFoundComponent` | ✅ | — | 404 Not Found |

---

## 3. Arquitectura de Componentes del Host

### 3.1 Árbol de Componentes (Standalone)

```
AppComponent (root — Standalone, Zoneless)
├── <p-toast position="top-right"> ← Mensajería global PrimeNG (publicada vía ToastService)
├── LoginComponent (Standalone) ← Paso credenciales + paso OTP MFA en el mismo componente
└── ShellLayoutComponent (Standalone) ← 100% responsable del marco visual de 3 columnas
    ├── HeaderComponent (Standalone, Smart — wordmark "MIS |" + p-breadcrumb derivado de la URL + pill de usuario con dropdown)
    ├── SidebarComponent (Standalone, Smart — Col 1: Tira de sistemas en barra azul con etiquetas cortas)
    └── SidebarNavPanelComponent (Standalone, Smart — Col 2: Menú persistente según sistema activo)
        └── <router-outlet>
            ├── [Módulo Inicio (/inicio)]
            │   └── InicioComponent (Standalone, Smart — dashboard "Mi espacio")
            ├── [Módulo Admin (/admin) — 3 gestiones, cada una con Lista y Detalle]
            │   ├── gestion-sistemas/
            │   │   ├── SistemasListComponent (Standalone, Smart)
            │   │   ├── SistemaDetalleComponent (Standalone, Smart — Detalle General | Estructura | Roles)
            │   │   └── SistemaFormComponent (Standalone, Smart)
            │   ├── gestion-roles/
            │   │   ├── RolesListComponent (Standalone, Smart)
            │   │   ├── RolDetalleComponent (Standalone, Smart — Detalle General | Usuarios)
            │   │   └── RolFormComponent (Standalone, Smart)
            │   └── gestion-usuarios/
            │       ├── UsuariosListComponent (Standalone, Smart)
            │       ├── UsuarioDetalleComponent (Standalone, Smart — Información General | Roles)
            │       └── UsuarioFormComponent (Standalone, Smart)
            └── [Sistemas Embebidos (/:remoteName)]
                └── RemoteWrapperComponent (Standalone, Smart)
                    ├── @defer (loading) → RemoteSkeletonComponent
                    ├── @defer (error)   → RemoteErrorComponent
                    └── @defer (main)    → <componente-remoto-inyectado>
```

---

## 4. Estructura y Detalles de los Componentes (Cards + SelectButton)

Para evitar drawers colapsables y layouts sobrecargados, **toda vista de gestión se encapsula en una `p-card` a ancho completo** con dos zonas obligatorias:

- **Header de card** (`pTemplate="header"`): título + descripción a la izquierda y el botón de acción principal a la derecha (Nuevo Usuario / Nuevo Rol / Nuevo Sistema / Editar).
- **Body de card**: buscadores, tablas `p-table`, formularios o pestañas.

Las vistas **no llevan títulos de página ni enlaces "Volver" propios** — el contexto de navegación lo da exclusivamente el breadcrumb del header (regla HD-01, §6). Los formularios y detalles usan el control segmentado `<p-selectButton>` para togglear entre subsecciones de datos:

### 4.1 Gestión de Sistemas: `SistemaDetalleComponent` (+ `SistemasListComponent` / `SistemaFormComponent`)
- **Lista (`SistemasListComponent`):** tabla de sistemas registrados con acciones Ver detalle / Editar / Eliminar.
- **Detalle (`SistemaDetalleComponent`)** — ítems segmentados (`tab`):
  1. **`Detalle General`**: datos generales del sistema (slug, URL del remoteEntry, versión, estado de red) y resumen de estructura.
  2. **`Estructura`**: árbol jerárquico editable de Secciones, Subsecciones y Módulos.
  3. **`Roles`**: asignación de accesos por Rol para cada Módulo del sistema (permisos a nivel de módulo).
- **Formulario (`SistemaFormComponent`):** pestañas `Identificación` / `Despliegue` para crear o editar el registro.

### 4.2 Gestión de Roles: `RolDetalleComponent` (+ `RolesListComponent` / `RolFormComponent`)
- **Lista (`RolesListComponent`):** tabla de roles con acceso al detalle y edición.
- **Detalle (`RolDetalleComponent`)** — ítems segmentados (`tab`):
  1. **`Detalle General`**: código identificador (slug), nombre del rol, resumen (sistemas/usuarios) y la lista de **sistemas con acceso** (los permisos por módulo se configuran en el detalle de cada sistema).
  2. **`Usuarios`**: tabla de usuarios vinculados al rol (*Nombre*, *Correo*, *Estado*, *Creado*) con enlace al detalle de cada usuario.
- **Formulario (`RolFormComponent`):** nombre, slug auto-generado y checklist de sistemas asignados.

### 4.3 Gestión de Usuarios: `UsuarioDetalleComponent` (+ `UsuariosListComponent` / `UsuarioFormComponent`)
- **Lista (`UsuariosListComponent`):** búsqueda, paginación, toggle de estado y acciones Ver detalle / Editar.
- **Detalle (`UsuarioDetalleComponent`)** — ítems segmentados (`tab`):
  1. **`Información General`**: nombre completo, correo, estado y fecha de creación.
  2. **`Roles`**: rol asignado (con enlace al detalle del rol) y sistemas habilitados para el usuario.
- **Formulario (`UsuarioFormComponent`):** pestañas `Información General` / `Roles y Sistemas` para crear o editar la cuenta.

---

## 5. Reglas de Comportamiento del Sidebar

| Regla | Descripción |
|---|---|
| **SB-01** | El primer icono de la barra azul es siempre el sistema de **Inicio** (Host Principal). |
| **SB-02** | Todos los sistemas remotos (remotes) configurados aparecen directamente como iconos con sus etiquetas de texto correspondientes en la barra azul. |
| **SB-03** | La Columna 2 (menú del sistema) es persistente y nunca colapsa. Su contenido se modula al cambiar de sistema. |
| **SB-04** | El Host maneja en su menú las opciones de administración `Gestión de usuarios`, `Gestión de roles` y `Gestión de sistemas` bajo la sección **Accesos [Admin]**; el acceso directo se etiqueta `Mi espacio` y el panel del Host se titula `Host Principal`. |
| **SB-05** | Las acciones de usuario (Perfil y Salir) residen exclusivamente en el dropdown del header en el extremo derecho. |

---

## 6. Reglas de Header y Mensajería

| Regla | Descripción |
|---|---|
| **HD-01** | El **breadcrumb vive únicamente en el header** del layout (`p-breadcrumb` de PrimeNG junto al wordmark `MIS \|`). Se deriva automáticamente de la URL activa; los tramos intermedios son navegables y el ícono 🏠 lleva a `/inicio/dashboard`. Ninguna vista renderiza breadcrumbs, títulos de página ni enlaces "Volver" propios. |
| **HD-02** | Para rutas de remotes (`/{slug}/...`), el breadcrumb muestra el **nombre registrado del sistema** y formatea los subsegmentos internos de kebab-case a texto legible (`🏠 / Reportes / Reportes operativos`). |
| **MSG-01** | Toda notificación efímera usa el **Toast de PrimeNG** (`<p-toast position="top-right">` montado una sola vez en el root) publicado a través de `ToastService` (fachada sobre `MessageService`) con severidades `success/info/warn/error` y auto-cierre a los 4.5 s. |
| **MSG-02** | El `roleGuard` emite un toast de severidad `warn` ("Acceso denegado") al redirigir a un usuario sin permisos hacia `/inicio/dashboard`. |
| **MSG-03** | Los errores de API dentro de una vista usan `InlineErrorComponent` (con botón Reintentar); los estados vacíos usan `EmptyStateComponent`. Las confirmaciones destructivas usan `p-dialog` modal. |

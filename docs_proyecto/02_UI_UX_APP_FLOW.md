# 02 — UI/UX App Flow (Frontend y Componentes)
> **Proyecto:** MIS - Management Information System  
> **Documentación Activa:** [01_PRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/01_PRD.md) | [02_UI_UX_APP_FLOW](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/02_UI_UX_APP_FLOW.md) | [03_TRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/03_TRD.md) | [04_BACKEND_SCHEMA](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/04_BACKEND_SCHEMA.md) | [05_IMPLEMENTATION_PLAN](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/05_IMPLEMENTATION_PLAN.md) | [06_FIGMA_UX_KIT](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/06_FIGMA_UX_KIT.html)  
> **Versión:** 1.4.0  
> **Fecha:** 2026-07-12  
> **Estado:** 🟢 Aprobado

---

## 1. Estructura de Módulos del Host

La arquitectura del Host se organiza en exactamente **3 áreas o módulos funcionales**:

1. **Mi espacio / Dashboard (`/admin/dashboard`)**:
   * Panel principal del Host.
2. **Gestión de Accesos (Usuarios, Roles y sistemas — `/admin/accesos`)**:
   * Módulo unificado para administrar el personal, definir roles y asignar accesos.
3. **Gestión de Sistemas (Configuración de MFEs — `/admin/sistemas`)**:
   * Registro y configuración de los microfrontends remotos.
4. **Gestión de Sistemas Embebidos (`/admin/:remoteName`)**:
   * Envoltorio y cargador dinámico (`RemoteWrapperComponent`) en `core/federation/` que inyecta en tiempo de ejecución los microfrontends remotos (Contabilidad, RRHH, Ventas, Logística).

---

## 2. Mapa de Rutas Real (`app.routes.ts`)

### 2.1 Rutas Internas de la Aplicación

| Ruta | Componente Cargado | Lazy Load | Guard | Acceso / Propósito |
|---|---|---|---|---|
| `/login` | `LoginComponent` | ✅ | — | Inicio de sesión con paso MFA |
| `/admin` | Redirect → `/admin/dashboard` | — | `authGuard` | Todos |
| `/admin/dashboard` | `DashboardComponent` | ✅ | `authGuard` | Todos (Etiqueta: "Mi espacio") |
| `/admin/accesos` | `AccesosShellComponent` | ✅ | `authGuard` + `roleGuard('admin-sistema')` | Admin Sistema (Menú de IAM) |
| `/admin/accesos/usuarios` | `UsuariosListComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/usuarios/nuevo` | `UsuarioFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/usuarios/:id` | `UsuarioFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/roles` | `RolesListComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/roles/nuevo` | `RolFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/roles/:id` | `RolDetalleComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/accesos/roles/:id/editar` | `RolFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/sistemas` | `SistemasListComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema (Gestión de Sistemas) |
| `/admin/sistemas/nuevo` | `SistemaFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/sistemas/:id` | `SistemaDetalleComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/sistemas/:id/editar` | `SistemaFormComponent` | ✅ | `roleGuard('admin-sistema')` | Admin Sistema |
| `/admin/:remoteName` | `RemoteWrapperComponent` | ✅ | `authGuard` | Carga de Sistemas Embebidos |
| `**` | `NotFoundComponent` | ✅ | — | 404 Not Found |

---

## 3. Arquitectura de Componentes del Host

### 3.1 Árbol de Componentes (Standalone)

```
AppComponent (root — Standalone, Zoneless)
├── LoginComponent (Standalone) ← Autenticación básica y pantalla MFA en secuencia limpia
└── ShellLayoutComponent (Standalone) ← 100% responsable del marco visual de 3 columnas
    ├── HeaderComponent (Standalone, Dumb)
    ├── SidebarComponent (Standalone, Smart — Col 1: Tira de sistemas en barra azul con etiquetas cortas)
    └── SidebarNavPanelComponent (Standalone, Smart — Col 2: Menú persistente según sistema activo)
        └── <router-outlet>
            ├── [Área 1: Mi espacio]
            │   └── DashboardComponent (Standalone, Smart)
            ├── [Área 2: Gestión (Usuarios, Roles y Registro de Sistemas)]
            │   ├── UsuariosListComponent (Standalone, Smart)
            │   ├── UsuarioFormComponent (Standalone, Smart)
            │   ├── RolesListComponent (Standalone, Smart)
            │   ├── RolFormComponent (Standalone, Smart)
            │   ├── RolDetalleComponent (Standalone, Smart)
            │   ├── SistemasListComponent (Standalone, Smart)
            │   ├── SistemaFormComponent (Standalone, Smart)
            │   └── SistemaDetalleComponent (Standalone, Smart)
            └── [Área 3: Sistemas Embebidos (Remotes)]
                └── RemoteWrapperComponent (Standalone, Smart)
                    ├── @defer (loading) → RemoteSkeletonComponent
                    ├── @defer (error)   → RemoteErrorComponent
                    └── @defer (main)    → <componente-remoto-inyectado>
```

---

## 4. Estructura y Detalles de los Componentes (SelectButton)

Para evitar drawers colapsables y layouts sobrecargados, todos los formularios y vistas detalladas de gestión se muestran a ancho completo y utilizan el control segmentado `<p-selectButton>` de PrimeNG para togglear entre subsecciones de datos:

### 4.1 Gestión de Usuarios: `UsuarioFormComponent`
- **Uso de Formulario:** Permite crear o editar un usuario.
- **Toggles segmentados (`activeTab`):**
  1. **`Información General`**:
     * Código Personal (Sólo lectura si es edición).
     * Nro. Documento (DNI).
     * Nombre Completo.
     * Correo Electrónico (Trabajo).
     * Puesto / Cargo.
     * Unidad / Área.
     * Estado Laboral.
  2. **`Roles y Sistemas`**:
     * Rol del Sistema (dropdown de selección de rol: admin-sistema, supervisor-ventas, etc.).
     * Sistemas Habilitados (check list de remotes en el manifest).
     * Switch de Estado de Acceso (Habilitado/Deshabilitado).

### 4.2 Gestión de Roles: `RolDetalleComponent`
- **Uso de Detalle:** Muestra la configuración completa del rol seleccionado.
- **Toggles segmentados (`tab`):**
  1. **`Información del Rol`**:
     * Código identificador (slug) y Nombre del Rol.
     * Descripción de Funciones.
     * Nivel de Seguridad (dropdown: Nivel 1 Super, Nivel 2 Medio, Nivel 3 Básico).
  2. **`Permisos Asignados`**:
     * Grid de tarjetas de permisos por subsistema (matriz CRUD de microfrontends). Cada tarjeta muestra contadores semánticos individuales de permisos para: *Crear*, *Leer*, *Actualizar* y *Eliminar*.
  3. **`Usuarios Vinculados`**:
     * Tabla con las columnas: *Código Personal*, *Documento*, *Nombre Completo*, *Email*, *Puesto* y *Área*.

### 4.3 Gestión de Sistemas (MFEs): `SistemaDetalleComponent` y `SistemaFormComponent`
- **Uso de Formulario (`SistemaFormComponent`):**
  * Toggles segmentados (`activeTab`):
    1. **`Información de Registro`**: Nombre del Módulo, Ruta Slug (read-only si es edición), y URL del Manifest (remoteEntry).
    2. **`Configuración de Despliegue`**: Proveedor de Infraestructura, Puerto de ejecución local, y Switch de Estado (Online/Offline).
- **Uso de Detalle (`SistemaDetalleComponent`):**
  * Toggles segmentados (`tab`):
    1. **`Información`**: Datos generales del sistema y estado de red.
    2. **`Estructura`**: Árbol jerárquico de Secciones, Subsecciones y Módulos.
    3. **`Permisos`**: Tabla de asignación de accesos por Rol para cada Módulo.

---

## 5. Reglas de Comportamiento del Sidebar

| Regla | Descripción |
|---|---|
| **SB-01** | El primer icono de la barra azul es siempre el sistema de **Inicio** (Host Principal). |
| **SB-02** | Todos los sistemas remotos (remotes) configurados aparecen directamente como iconos con sus etiquetas de texto correspondientes en la barra azul. |
| **SB-03** | La Columna 2 (menú del sistema) es persistente y nunca colapsa. Su contenido se modula al cambiar de sistema. |
| **SB-04** | El Host maneja en su menú las opciones de administración `Gestión de usuarios`, `Gestión de roles` y `Gestión de sistemas` bajo la sección **Accesos [Admin]**. |
| **SB-05** | Las acciones de usuario (Perfil y Salir) residen exclusivamente en el dropdown del header en el extremo derecho. |

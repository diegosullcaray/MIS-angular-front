# 04 — Backend Schema (Integración de Datos — API y Estado)
> **Proyecto:** MIS - Management Information System  
> **Documentación Activa:** [01_PRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/01_PRD.md) | [02_UI_UX_APP_FLOW](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/02_UI_UX_APP_FLOW.md) | [03_TRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/03_TRD.md) | [04_BACKEND_SCHEMA](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/04_BACKEND_SCHEMA.md) | [05_IMPLEMENTATION_PLAN](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/05_IMPLEMENTATION_PLAN.md) | [06_FIGMA_UX_KIT](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/docs_proyecto/06_FIGMA_UX_KIT.html)  
> **Versión:** 1.0.0  
> **Fecha:** 2026-07-09  
> **Estado:** 🟡 En revisión

---

## 1. Estrategia de Consumo de APIs

| Actor | APIs que Consume | Estrategia |
|---|---|---|
| **Host (MIS)** | APIs REST propias: catálogos, usuarios, roles y configuración del panel | `HttpClient` + `withFetch()` |
| **Remote (Subsistema)** | APIs REST propias de su dominio | `HttpClient` independiente, configurado en el Remote |

> ⚠️ **Regla de Aislamiento:** Los Remotes **nunca** llaman APIs del Host ni viceversa. La única comunicación entre ellos es a través del `ShellStateService` vía Signals.

> 🧪 **Modo desarrollo (Fake API):** mientras el backend real no exista, todos los endpoints `/api/v1/*`
> son atendidos por `fakeApiInterceptor` (`src/app/core/fake-api/`) con una base de datos en memoria
> que implementa este contrato (incluye latencia simulada y validación de rol por token).
> Para conectar el backend real basta con retirar el interceptor de `app.config.ts`.

---

## 2. Endpoints del Host — Catálogos

### Base URL

```
/api/v1   (relativo — configurado por proxy o variable de entorno)
```

### 2.1 `GET /api/v1/catalogos`

Obtiene la lista de tipos de catálogos disponibles en el Host.

**Request:** Sin body.

**Response `200 OK`:**
```json
[
  {
    "id": "cat-001",
    "tipo": "bancos",
    "nombre": "Catálogo de Bancos",
    "totalRegistros": 45,
    "activo": true,
    "ultimaActualizacion": "2026-07-08T14:30:00Z"
  }
]
```

---

### 2.2 `GET /api/v1/catalogos/:tipo`

Obtiene los ítems de un catálogo específico.

**Path Param:** `tipo` — slug del tipo de catálogo (ej. `bancos`, `monedas`, `departamentos`)

**Query Params:**
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | `number` | `1` | Página de resultados |
| `pageSize` | `number` | `20` | Ítems por página |
| `q` | `string` | — | Búsqueda por texto |

**Response `200 OK`:**
```json
{
  "tipo": "bancos",
  "page": 1,
  "pageSize": 20,
  "total": 45,
  "items": [
    {
      "id": "ban-001",
      "codigo": "BCP",
      "descripcion": "Banco de Crédito del Perú",
      "activo": true
    }
  ]
}
```

---

### 2.3 `POST /api/v1/catalogos/:tipo`

Crea un nuevo ítem en el catálogo especificado.

**Request Body:**
```json
{
  "codigo": "string",
  "descripcion": "string",
  "activo": true
}
```

**Response `201 Created`:**
```json
{
  "id": "ban-002",
  "codigo": "BBVA",
  "descripcion": "BBVA Perú",
  "activo": true
}
```

---

### 2.4 `PUT /api/v1/catalogos/:tipo/:id`

Actualiza un ítem existente del catálogo.

**Response `200 OK`:** Ítem actualizado (mismo schema que POST response).

---

### 2.5 `DELETE /api/v1/catalogos/:tipo/:id`

Elimina (soft delete) un ítem del catálogo.

**Response `204 No Content`.**

---

## 3. Endpoints del Host — Gestión de Accesos (IAM)

> Estos endpoints solo son accesibles para el rol `admin-sistema`. El backend valida el JWT y el claim de rol.

### 3.1 `GET /api/v1/usuarios`

Listado paginado de usuarios del sistema.

**Query Params:** `page`, `pageSize`, `q` (búsqueda por nombre/email), `activo` (boolean)

**Response `200 OK`:**
```json
{
  "page": 1, "pageSize": 20, "total": 12,
  "items": [
    { "id": "usr-001", "nombre": "Diego Sullcarayra", "email": "diego@confianza.pe",
      "rol": "admin-sistema", "activo": true, "creadoEn": "2026-01-15T00:00:00Z" }
  ]
}
```

### 3.2 `POST /api/v1/usuarios` — Crear usuario

```json
{
  "nombre": "string",
  "email": "string",
  "password": "string",
  "rolId": "string",
  "subsistemas": ["subsistema-contabilidad", "subsistema-rrhh"]
}
```
**Response `201 Created`:** Objeto `Usuario` completo.

### 3.3 `PUT /api/v1/usuarios/:id` — Editar usuario

Mismo body que POST (sin `password` si no cambia).

### 3.4 `PATCH /api/v1/usuarios/:id/estado` — Activar/desactivar

```json
{ "activo": false }
```
**Response `200 OK`:** `{ "activo": false }`

---

### 3.5 `GET /api/v1/roles`

```json
[
  { "id": "rol-001", "nombre": "Admin Sistema", "slug": "admin-sistema",
    "subsistemas": ["subsistema-contabilidad", "subsistema-rrhh"] },
  { "id": "rol-002", "nombre": "Supervisor de Área", "slug": "supervisor-area",
    "subsistemas": ["subsistema-rrhh"] }
]
```

### 3.6 `POST /api/v1/roles` / `PUT /api/v1/roles/:id`

```json
{
  "nombre": "string",
  "slug": "string",
  "subsistemas": ["string"]
}
```
**Response `201 Created` / `200 OK`:** Objeto `Rol` completo.

### 3.7 `DELETE /api/v1/roles/:id`

**Response `204 No Content`.**  
> Solo si no tiene usuarios asignados; de lo contrario devuelve `409 Conflict`.

---

## 3B. Endpoints del Host — Sistemas Registrados

> El MIS es un **centralizador de sistemas**: cada Remote se registra como un `Sistema` con una
> estructura jerárquica `Sistema → Secciones → Subsecciones → Módulos`. Los permisos de los roles
> se controlan **a nivel de módulo**. Los endpoints de escritura requieren rol `admin-sistema`.

### 3B.1 `GET /api/v1/sistemas`

Listado resumido de sistemas registrados.

**Response `200 OK`:**
```json
[
  {
    "id": "sis-001", "nombre": "Contabilidad", "slug": "subsistema-contabilidad",
    "descripcion": "Gestión contable y tesorería", "icono": "pi pi-chart-bar",
    "version": "1.4.2", "estado": "activo",
    "totalSecciones": 3, "totalModulos": 9, "rolesAsignados": 2,
    "actualizadoEn": "2026-07-01T00:00:00Z"
  }
]
```

### 3B.2 `GET /api/v1/sistemas/:id`

Detalle completo (acepta `id` o `slug`). Incluye el árbol `secciones[] → subsecciones[] → modulos[]`.

### 3B.3 `POST /api/v1/sistemas` / `PUT /api/v1/sistemas/:id`

Crea/actualiza la **información general** del sistema (no la estructura).

```json
{
  "nombre": "string", "slug": "string", "descripcion": "string",
  "icono": "pi pi-*", "url": "http://host/remoteEntry.json",
  "version": "string", "estado": "activo | mantenimiento | inactivo"
}
```
> `slug` es inmutable tras la creación (identifica al Remote en `federation.manifest.json`).
> `POST` responde `409 Conflict` si el slug ya existe.

### 3B.4 `PUT /api/v1/sistemas/:id/estructura`

Reemplaza el árbol completo de secciones del sistema.

**Request Body:** `Seccion[]` — cada sección con sus `subsecciones[]` y `modulos[]`.
**Response `200 OK`:** `Sistema` actualizado.
> Los permisos que referencien módulos eliminados se depuran automáticamente.

### 3B.5 `DELETE /api/v1/sistemas/:id`

**Response `204 No Content`.**
> `409 Conflict` si el sistema está asignado a algún rol.

### 3B.6 Permisos por rol (a nivel de módulo)

| Endpoint | Descripción |
|---|---|
| `GET /api/v1/sistemas/:id/permisos` | `PermisoRolSistema[]` de todos los roles en ese sistema |
| `PUT /api/v1/sistemas/:id/permisos/:rolId` | Body `{ "modulos": ["mod-001", ...] }` — reemplaza los módulos permitidos del rol |
| `GET /api/v1/roles/:id/permisos` | Permisos del rol en **todos** los sistemas (para el detalle de rol) |
| `GET /api/v1/roles/:id/usuarios` | Usuarios que tienen asignado el rol (para el detalle de rol) |

### 3B.7 Modelo jerárquico (`src/app/pages/modules/sistemas/models/sistema.model.ts`)

```typescript
export type SistemaEstado = 'activo' | 'mantenimiento' | 'inactivo';

export interface Modulo     { id: string; nombre: string; slug: string; activo: boolean; }
export interface Subseccion { id: string; nombre: string; slug: string; modulos: Modulo[]; }
export interface Seccion    { id: string; nombre: string; slug: string; subsecciones: Subseccion[]; }

export interface Sistema {
  id: string;
  nombre: string;
  slug: string;            // nombre del Remote en federation.manifest.json
  descripcion: string;
  icono: string;           // clase PrimeIcons
  url: string;             // remoteEntry.json
  version: string;
  estado: SistemaEstado;
  secciones: Seccion[];
  creadoEn: string;        // ISO 8601
  actualizadoEn: string;   // ISO 8601
}

/** Permiso de un rol sobre los módulos de un sistema. */
export interface PermisoRolSistema {
  rolId: string;
  sistemaId: string;
  modulos: string[];       // IDs de módulos habilitados
}
```

---

## 4. Interfaces TypeScript (Modelos)

### `src/app/features/catalogos/models/catalogo.model.ts`

```typescript
// ─── Tipos de Catálogo (metadata) ────────────────────────────────────────────

export interface CatalogoMeta {
  id: string;
  tipo: string;
  nombre: string;
  totalRegistros: number;
  activo: boolean;
  ultimaActualizacion: string; // ISO 8601
}

// ─── Ítem de Catálogo ─────────────────────────────────────────────────────────

export interface CatalogoItem {
  id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

// ─── Response Paginado ───────────────────────────────────────────────────────

export interface CatalogoPageResponse {
  tipo: string;
  page: number;
  pageSize: number;
  total: number;
  items: CatalogoItem[];
}

// ─── Request de Creación/Edición ─────────────────────────────────────────────

export interface CatalogoItemRequest {
  codigo: string;
  descripcion: string;
  activo: boolean;
}

// ─── Estado de Error de API ──────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}
```

### `src/app/features/accesos/models/acceso.model.ts`

```typescript
// ─── Rol del sistema ───────────────────────────────────────────────────────────────

export type RolSlug = 'admin-sistema' | 'admin-general' | 'supervisor-area';

export interface Rol {
  id: string;
  nombre: string;
  slug: RolSlug;
  subsistemas: string[];  // slugs de Remotes habilitados para este rol
}

// ─── Usuario del sistema ─────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolSlug;
  subsistemas: string[];  // Remotes habilitados para este usuario específico
  activo: boolean;
  creadoEn: string; // ISO 8601
}

// ─── Requests ────────────────────────────────────────────────────────────────────

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password?: string;  // Opcional en edición
  rolId: string;
  subsistemas: string[];
}

export interface RolRequest {
  nombre: string;
  slug: string;
  subsistemas: string[];
}

// ─── Responses paginados ─────────────────────────────────────────────────────────

export interface PageResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}
```

---

## 5. Estado Global Compartido — `ShellStateService`

### Ubicación

```
src/app/core/services/shell-state.service.ts
```

### Implementación

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { RolSlug } from '../../features/accesos/models/acceso.model';

export interface UsuarioActivo {
  id: string;
  nombre: string;
  rol: RolSlug;  // 'admin-sistema' | 'admin-general' | 'supervisor-area'
  subsistemas: string[]; // Remotes habilitados para este usuario
}

export interface MenuItemActivo {
  ruta: string;
  etiqueta: string;
  subsistema?: string;
}

@Injectable({ providedIn: 'root' })
export class ShellStateService {

  // ─── Signals privados (escritura solo desde el Host) ─────────────────────

  private readonly _usuarioActivo = signal<UsuarioActivo | null>(null);
  private readonly _menuItemActivo = signal<MenuItemActivo | null>(null);
  private readonly _catalogoActivo = signal<string | null>(null);

  // ─── Signals de solo lectura (expuestos a Remotes) ───────────────────────

  /** Usuario autenticado actualmente en el sistema. */
  readonly usuarioActivo = this._usuarioActivo.asReadonly();

  /** Ítem del menú principal actualmente seleccionado. */
  readonly menuItemActivo = this._menuItemActivo.asReadonly();

  /** Slug del catálogo activo (seleccionado en el Host). */
  readonly catalogoActivo = this._catalogoActivo.asReadonly();

  // ─── Computed ────────────────────────────────────────────────────────────

  /** True si el usuario es Administrador del Sistema (puede gestionar IAM). */
  readonly esAdminSistema = computed(() => this._usuarioActivo()?.rol === 'admin-sistema');

  /** True si el usuario tiene acceso a gestión operativa (admin-general o admin-sistema). */
  readonly esAdmin = computed(() =>
    ['admin-sistema', 'admin-general'].includes(this._usuarioActivo()?.rol ?? '')
  );

  /** Subsistemas habilitados para el usuario activo (controla visibilidad en el sidebar). */
  readonly subsistemas = computed(() => this._usuarioActivo()?.subsistemas ?? []);

  // ─── Métodos de mutación (solo el Host puede invocar estos) ──────────────

  setUsuarioActivo(usuario: UsuarioActivo): void {
    this._usuarioActivo.set(usuario);
  }

  setMenuItemActivo(item: MenuItemActivo): void {
    this._menuItemActivo.set(item);
  }

  setCatalogoActivo(slug: string): void {
    this._catalogoActivo.set(slug);
  }
}
```

> ✅ **Patrón de Contrato:** Los Remotes **importan** `ShellStateService` y leen `usuarioActivo()`, `catalogoActivo()` como Signals de solo lectura. No tienen acceso a los métodos `set*`.

---

## 5. Servicio de Catálogos (`CatalogosService`)

### Ubicación

```
src/app/features/catalogos/services/catalogos.service.ts
```

### Implementación con Signals + HttpClient

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogoMeta, CatalogoPageResponse, CatalogoItemRequest, CatalogoItem, ApiError } from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/catalogos';

  // ─── Estado reactivo ─────────────────────────────────────────────────────

  readonly isLoading = signal<boolean>(false);
  readonly error = signal<ApiError | null>(null);
  readonly catalogosMeta = signal<CatalogoMeta[]>([]);
  readonly paginaActual = signal<CatalogoPageResponse | null>(null);

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly tieneError = computed(() => this.error() !== null);
  readonly totalItems = computed(() => this.paginaActual()?.total ?? 0);

  // ─── Métodos ─────────────────────────────────────────────────────────────

  cargarCatalogos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<CatalogoMeta[]>(this.baseUrl).subscribe({
      next: (data) => {
        this.catalogosMeta.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set({ status: err.status, message: err.message, timestamp: new Date().toISOString() });
        this.isLoading.set(false);
      }
    });
  }

  cargarItems(tipo: string, page = 1, pageSize = 20, q?: string): void {
    this.isLoading.set(true);
    let params: Record<string, string | number> = { page, pageSize };
    if (q) params['q'] = q;

    this.http.get<CatalogoPageResponse>(`${this.baseUrl}/${tipo}`, { params }).subscribe({
      next: (data) => {
        this.paginaActual.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set({ status: err.status, message: err.message, timestamp: new Date().toISOString() });
        this.isLoading.set(false);
      }
    });
  }

  crearItem(tipo: string, request: CatalogoItemRequest) {
    return this.http.post<CatalogoItem>(`${this.baseUrl}/${tipo}`, request);
  }

  actualizarItem(tipo: string, id: string, request: CatalogoItemRequest) {
    return this.http.put<CatalogoItem>(`${this.baseUrl}/${tipo}/${id}`, request);
  }

  eliminarItem(tipo: string, id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${tipo}/${id}`);
  }
}
```

---

## 6. Contrato de Comunicación Host ↔ Remote

```
┌────────────────────────────────────────────────────────────┐
│                     HOST (MIS Shell)                       │
│                                                            │
│  ShellStateService                                         │
│   ├── _usuarioActivo (signal privado)  ─── SET aquí       │
│   ├── _menuItemActivo (signal privado) ─── SET aquí       │
│   └── _catalogoActivo (signal privado) ─── SET aquí       │
│                                                            │
│   Expone: usuarioActivo.asReadonly()  ────────────────┐   │
│           menuItemActivo.asReadonly() ─────────────┐  │   │
│           catalogoActivo.asReadonly() ──────────┐  │  │   │
└─────────────────────────────────────────────────│──│──│───┘
                                                  │  │  │
              READ-ONLY (solo lectura) ────────────┘  │  │
                                                      │  │
┌─────────────────────────────────────────────────────│──│───┐
│                   REMOTE (Subsistema X)             │  │   │
│                                                     │  │   │
│   inject(ShellStateService)                         │  │   │
│    └── lee: catalogoActivo()  ◄─────────────────────┘  │   │
│    └── lee: usuarioActivo()   ◄────────────────────────┘   │
│                                                             │
│   ❌ NO puede invocar setUsuarioActivo()                    │
│   ❌ NO puede invocar setCatalogoActivo()                   │
└─────────────────────────────────────────────────────────────┘
```

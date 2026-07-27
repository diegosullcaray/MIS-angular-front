// ─── Tipos de Rol ─────────────────────────────────────────────────────────────

export type RolSlug = 'admin-sistema' | 'admin-general' | 'supervisor-area';

export interface Rol {
  id: string;
  nombre: string;
  slug: RolSlug;
  /** Slugs de Remotes habilitados para este rol */
  subsistemas: string[];
}

// ─── Usuario del sistema ───────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolSlug;
  /** Remotes habilitados para este usuario (puede sobrescribir al rol) */
  subsistemas: string[];
  activo: boolean;
  creadoEn: string; // ISO 8601
}

// ─── Requests ──────────────────────────────────────────────────────────────────

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password?: string;   // Opcional en edición
  rolId: string;
  subsistemas: string[];
}

export interface RolRequest {
  nombre: string;
  slug: string;
  subsistemas: string[];
}

// ─── Responses paginados ───────────────────────────────────────────────────────

export interface PageResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

// ─── Labels de roles para la UI ───────────────────────────────────────────────

export const ROL_LABELS: Record<RolSlug, string> = {
  'admin-sistema':   'Administrador del Sistema',
  'admin-general':   'Administrador General',
  'supervisor-area': 'Supervisor de Área',
};

export const ROL_SEVERITY: Record<RolSlug, string> = {
  'admin-sistema':   'danger',
  'admin-general':   'warn',
  'supervisor-area': 'info',
};

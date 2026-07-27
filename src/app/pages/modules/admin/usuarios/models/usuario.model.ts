import type { RolSlug } from '../../roles/models/rol.model';

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

// ─── Responses paginados ───────────────────────────────────────────────────────

export interface PageResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

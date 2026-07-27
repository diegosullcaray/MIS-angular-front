// ─── Tipos de Rol ─────────────────────────────────────────────────────────────

export type RolSlug = 'admin-sistema' | 'admin-general' | 'supervisor-area';

export interface Rol {
  id: string;
  nombre: string;
  slug: RolSlug;
  /** Slugs de Remotes habilitados para este rol */
  subsistemas: string[];
}

export interface RolRequest {
  nombre: string;
  slug: string;
  subsistemas: string[];
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

// ─── Estados de un sistema registrado ─────────────────────────────────────────

export type SistemaEstado = 'activo' | 'mantenimiento' | 'inactivo';

export const SISTEMA_ESTADO_LABELS: Record<SistemaEstado, string> = {
  activo:        'Activo',
  mantenimiento: 'En mantenimiento',
  inactivo:      'Inactivo',
};

// ─── Jerarquía: Sistema → Sección → Subsección → Módulo ──────────────────────

export interface Modulo {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
}

export interface Subseccion {
  id: string;
  nombre: string;
  slug: string;
  modulos: Modulo[];
}

export interface Seccion {
  id: string;
  nombre: string;
  slug: string;
  subsecciones: Subseccion[];
}

// ─── Sistema registrado (Remote embebible) ────────────────────────────────────

export interface Sistema {
  id: string;
  nombre: string;
  /** Slug único — coincide con el nombre del Remote en federation.manifest.json */
  slug: string;
  descripcion: string;
  /** Clase PrimeIcons para el sidebar (ej. `pi pi-chart-bar`) */
  icono: string;
  /** URL del remoteEntry.json del micro-frontend */
  url: string;
  version: string;
  estado: SistemaEstado;
  secciones: Seccion[];
  creadoEn: string;       // ISO 8601
  actualizadoEn: string;  // ISO 8601
}

/** Resumen para el listado (sin el árbol completo). */
export interface SistemaResumen {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  icono: string;
  version: string;
  estado: SistemaEstado;
  totalSecciones: number;
  totalModulos: number;
  rolesAsignados: number;
  actualizadoEn: string;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface SistemaRequest {
  nombre: string;
  slug: string;
  descripcion: string;
  icono: string;
  url: string;
  version: string;
  estado: SistemaEstado;
}

// ─── Permisos: qué módulos de un sistema puede usar cada rol ─────────────────

export interface PermisoRolSistema {
  rolId: string;
  sistemaId: string;
  /** IDs de módulos habilitados para el rol en este sistema */
  modulos: string[];
}

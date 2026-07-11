// ─── Tipos de Catálogo (metadata) ─────────────────────────────────────────────

export interface CatalogoMeta {
  id: string;
  tipo: string;
  nombre: string;
  totalRegistros: number;
  activo: boolean;
  ultimaActualizacion: string; // ISO 8601
}

// ─── Ítem de Catálogo ──────────────────────────────────────────────────────────

export interface CatalogoItem {
  id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

// ─── Response Paginado ─────────────────────────────────────────────────────────

export interface CatalogoPageResponse {
  tipo: string;
  page: number;
  pageSize: number;
  total: number;
  items: CatalogoItem[];
}

// ─── Requests de Creación / Edición ───────────────────────────────────────────

export interface CatalogoItemRequest {
  codigo: string;
  descripcion: string;
  activo: boolean;
}

// ─── Error de API ──────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}

import { Injectable, signal, computed } from '@angular/core';
import { timer } from 'rxjs';
import type {
  CatalogoMeta,
  CatalogoItem,
  CatalogoPageResponse,
  CatalogoItemRequest,
  ApiError,
} from '../models/catalogo.model';

// ─── Datos Mock (reemplazar por HttpClient cuando el backend esté listo) ───────

const MOCK_CATALOGOS: CatalogoMeta[] = [
  { id: 'cat-001', tipo: 'bancos',        nombre: 'Catálogo de Bancos',        totalRegistros: 12, activo: true, ultimaActualizacion: '2026-07-08T14:30:00Z' },
  { id: 'cat-002', tipo: 'monedas',       nombre: 'Catálogo de Monedas',       totalRegistros: 5,  activo: true, ultimaActualizacion: '2026-07-01T10:00:00Z' },
  { id: 'cat-003', tipo: 'departamentos', nombre: 'Catálogo de Departamentos', totalRegistros: 25, activo: true, ultimaActualizacion: '2026-06-15T08:00:00Z' },
  { id: 'cat-004', tipo: 'tipos-doc',     nombre: 'Tipos de Documento',        totalRegistros: 8,  activo: true, ultimaActualizacion: '2026-06-20T09:00:00Z' },
  { id: 'cat-005', tipo: 'estados',       nombre: 'Estados de Operación',      totalRegistros: 6,  activo: false, ultimaActualizacion: '2026-05-30T11:00:00Z' },
];

const MOCK_ITEMS: Record<string, CatalogoItem[]> = {
  bancos: [
    { id: 'ban-001', codigo: 'BCP',  descripcion: 'Banco de Crédito del Perú',   activo: true },
    { id: 'ban-002', codigo: 'BBVA', descripcion: 'BBVA Perú',                    activo: true },
    { id: 'ban-003', codigo: 'IBK',  descripcion: 'Interbank',                    activo: true },
    { id: 'ban-004', codigo: 'SCO',  descripcion: 'Scotiabank Perú',              activo: true },
    { id: 'ban-005', codigo: 'BAN',  descripcion: 'BANBIF',                       activo: false },
  ],
  monedas: [
    { id: 'mon-001', codigo: 'PEN', descripcion: 'Sol Peruano',     activo: true },
    { id: 'mon-002', codigo: 'USD', descripcion: 'Dólar Americano', activo: true },
    { id: 'mon-003', codigo: 'EUR', descripcion: 'Euro',            activo: true },
  ],
  departamentos: [
    { id: 'dep-001', codigo: 'LIM', descripcion: 'Lima',     activo: true },
    { id: 'dep-002', codigo: 'ARE', descripcion: 'Arequipa', activo: true },
    { id: 'dep-003', codigo: 'TRU', descripcion: 'La Libertad', activo: true },
    { id: 'dep-004', codigo: 'CUS', descripcion: 'Cusco',    activo: true },
    { id: 'dep-005', codigo: 'PIU', descripcion: 'Piura',    activo: true },
  ],
};

// ─── CatalogosService ─────────────────────────────────────────────────────────

/**
 * Servicio de Catálogos con Signals reactivos.
 *
 * ⚠️ MODO MOCK: Los métodos HTTP están simulados con timer(800ms).
 * Cuando el backend esté disponible, reemplazar timer() por:
 *   this.http.get<CatalogoMeta[]>(this.baseUrl).subscribe(...)
 */
@Injectable({ providedIn: 'root' })
export class CatalogosService {

  private readonly _baseUrl = '/api/v1/catalogos';

  // ─── Estado reactivo ────────────────────────────────────────────────────

  readonly isLoading     = signal<boolean>(false);
  readonly error         = signal<ApiError | null>(null);
  readonly catalogosMeta = signal<CatalogoMeta[]>([]);
  readonly paginaActual  = signal<CatalogoPageResponse | null>(null);

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly tieneError  = computed(() => this.error() !== null);
  readonly totalItems  = computed(() => this.paginaActual()?.total ?? 0);
  readonly hayResultados = computed(() => (this.paginaActual()?.items?.length ?? 0) > 0);

  // ─── Métodos HTTP (Mock) ──────────────────────────────────────────────────

  cargarCatalogos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Mock: simula delay de red de 800ms
    timer(800).subscribe(() => {
      this.catalogosMeta.set(MOCK_CATALOGOS);
      this.isLoading.set(false);
    });
  }

  cargarItems(tipo: string, page = 1, pageSize = 20, q?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    timer(600).subscribe(() => {
      let items = MOCK_ITEMS[tipo] ?? [];
      if (q) {
        const query = q.toLowerCase();
        items = items.filter(
          i => i.codigo.toLowerCase().includes(query) ||
               i.descripcion.toLowerCase().includes(query)
        );
      }
      const start = (page - 1) * pageSize;
      const paginados = items.slice(start, start + pageSize);

      this.paginaActual.set({
        tipo,
        page,
        pageSize,
        total: items.length,
        items: paginados,
      });
      this.isLoading.set(false);
    });
  }

  crearItem(tipo: string, request: CatalogoItemRequest): Promise<CatalogoItem> {
    return new Promise(resolve => {
      timer(500).subscribe(() => {
        const newItem: CatalogoItem = {
          id: `${tipo}-${Date.now()}`,
          ...request,
        };
        // Actualizar mock local
        if (MOCK_ITEMS[tipo]) {
          MOCK_ITEMS[tipo] = [...MOCK_ITEMS[tipo], newItem];
        }
        resolve(newItem);
      });
    });
  }

  actualizarItem(tipo: string, id: string, request: CatalogoItemRequest): Promise<CatalogoItem> {
    return new Promise(resolve => {
      timer(500).subscribe(() => {
        const updated: CatalogoItem = { id, ...request };
        if (MOCK_ITEMS[tipo]) {
          MOCK_ITEMS[tipo] = MOCK_ITEMS[tipo].map(i => i.id === id ? updated : i);
        }
        resolve(updated);
      });
    });
  }

  eliminarItem(tipo: string, id: string): Promise<void> {
    return new Promise(resolve => {
      timer(400).subscribe(() => {
        if (MOCK_ITEMS[tipo]) {
          MOCK_ITEMS[tipo] = MOCK_ITEMS[tipo].filter(i => i.id !== id);
        }
        resolve();
      });
    });
  }
}

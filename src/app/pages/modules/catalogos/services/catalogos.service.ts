import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  ApiError,
  CatalogoItem,
  CatalogoItemRequest,
  CatalogoMeta,
  CatalogoPageResponse,
} from '../models/catalogo.model';

/**
 * Servicio de Catálogos con Signals reactivos + HttpClient (04_BACKEND_SCHEMA §2).
 *
 * Consume la API REST `/api/v1/catalogos`. En desarrollo las peticiones son
 * atendidas por el `fakeApiInterceptor` (base en memoria); al conectar el
 * backend real este servicio no necesita cambios.
 */
@Injectable({ providedIn: 'root' })
export class CatalogosService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/catalogos';

  // ─── Estado reactivo ─────────────────────────────────────────────────────

  readonly isLoading     = signal<boolean>(false);
  readonly error         = signal<ApiError | null>(null);
  readonly catalogosMeta = signal<CatalogoMeta[]>([]);
  readonly paginaActual  = signal<CatalogoPageResponse | null>(null);

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly tieneError    = computed(() => this.error() !== null);
  readonly totalItems    = computed(() => this.paginaActual()?.total ?? 0);
  readonly hayResultados = computed(() => (this.paginaActual()?.items?.length ?? 0) > 0);

  // ─── Lecturas (actualizan signals) ───────────────────────────────────────

  cargarCatalogos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<CatalogoMeta[]>(this.baseUrl).subscribe({
      next: (data) => {
        this.catalogosMeta.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(this.toApiError(err));
        this.isLoading.set(false);
      },
    });
  }

  cargarItems(tipo: string, page = 1, pageSize = 20, q?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: Record<string, string | number> = { page, pageSize };
    if (q) params['q'] = q;

    this.http.get<CatalogoPageResponse>(`${this.baseUrl}/${tipo}`, { params }).subscribe({
      next: (data) => {
        this.paginaActual.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(this.toApiError(err));
        this.isLoading.set(false);
      },
    });
  }

  // ─── Mutaciones (Promises para await en componentes) ─────────────────────

  crearItem(tipo: string, request: CatalogoItemRequest): Promise<CatalogoItem> {
    return firstValueFrom(
      this.http.post<CatalogoItem>(`${this.baseUrl}/${tipo}`, request)
    );
  }

  actualizarItem(tipo: string, id: string, request: CatalogoItemRequest): Promise<CatalogoItem> {
    return firstValueFrom(
      this.http.put<CatalogoItem>(`${this.baseUrl}/${tipo}/${id}`, request)
    );
  }

  eliminarItem(tipo: string, id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${tipo}/${id}`)
    );
  }

  // ─── Privados ────────────────────────────────────────────────────────────

  private toApiError(err: unknown): ApiError {
    if (err instanceof HttpErrorResponse) {
      return {
        status: err.status,
        message: (err.error?.message as string) ?? err.message,
        timestamp: new Date().toISOString(),
      };
    }
    return { status: 0, message: 'Error de red desconocido', timestamp: new Date().toISOString() };
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  PermisoRolSistema,
  Seccion,
  Sistema,
  SistemaRequest,
  SistemaResumen,
} from '../models/sistema.model';

/**
 * Servicio de Gestión de Sistemas registrados (Remotes) con Signals + HttpClient.
 *
 * Administra el registro de sistemas, su estructura jerárquica
 * (Secciones → Subsecciones → Módulos) y los permisos por rol a nivel de módulo.
 * Solo accesible para `admin-sistema` (el backend valida el rol).
 */
@Injectable({ providedIn: 'root' })
export class SistemasService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/sistemas';

  // ─── Estado reactivo ─────────────────────────────────────────────────────

  readonly isLoading = signal<boolean>(false);
  readonly error     = signal<string | null>(null);
  readonly sistemas  = signal<SistemaResumen[]>([]);

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly totalSistemas = computed(() => this.sistemas().length);
  readonly totalActivos  = computed(() => this.sistemas().filter(s => s.estado === 'activo').length);

  // ─── Sistemas ────────────────────────────────────────────────────────────

  cargarSistemas(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<SistemaResumen[]>(this.baseUrl).subscribe({
      next: (data) => {
        this.sistemas.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(this.mensaje(err));
        this.isLoading.set(false);
      },
    });
  }

  obtenerSistema(idOSlug: string): Promise<Sistema> {
    return firstValueFrom(this.http.get<Sistema>(`${this.baseUrl}/${idOSlug}`));
  }

  async crearSistema(request: SistemaRequest): Promise<Sistema> {
    const nuevo = await firstValueFrom(
      this.http.post<Sistema>(this.baseUrl, request)
    );
    this.cargarSistemas();
    return nuevo;
  }

  async actualizarSistema(id: string, request: SistemaRequest): Promise<Sistema> {
    const actualizado = await firstValueFrom(
      this.http.put<Sistema>(`${this.baseUrl}/${id}`, request)
    );
    this.cargarSistemas();
    return actualizado;
  }

  async eliminarSistema(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    this.sistemas.update(list => list.filter(s => s.id !== id));
  }

  // ─── Estructura jerárquica ───────────────────────────────────────────────

  guardarEstructura(id: string, secciones: Seccion[]): Promise<Sistema> {
    return firstValueFrom(
      this.http.put<Sistema>(`${this.baseUrl}/${id}/estructura`, secciones)
    );
  }

  // ─── Permisos por rol ────────────────────────────────────────────────────

  obtenerPermisos(sistemaId: string): Promise<PermisoRolSistema[]> {
    return firstValueFrom(
      this.http.get<PermisoRolSistema[]>(`${this.baseUrl}/${sistemaId}/permisos`)
    );
  }

  guardarPermisosRol(sistemaId: string, rolId: string, modulos: string[]): Promise<PermisoRolSistema> {
    return firstValueFrom(
      this.http.put<PermisoRolSistema>(`${this.baseUrl}/${sistemaId}/permisos/${rolId}`, { modulos })
    );
  }

  /** Permisos de un rol en todos los sistemas (para el detalle de rol). */
  obtenerPermisosDeRol(rolId: string): Promise<PermisoRolSistema[]> {
    return firstValueFrom(
      this.http.get<PermisoRolSistema[]>(`/api/v1/roles/${rolId}/permisos`)
    );
  }

  // ─── Privados ────────────────────────────────────────────────────────────

  private mensaje(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) ?? err.message;
    }
    return 'Error de red desconocido';
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  PageResponse,
  Usuario,
  UsuarioRequest,
} from '../models/usuario.model';

/**
 * Servicio de Gestión de Usuarios (04_BACKEND_SCHEMA §3) con Signals + HttpClient.
 * Solo accesible para el rol `admin-sistema`; el backend (o la Fake API)
 * valida el token y el rol en cada petición.
 */
@Injectable({ providedIn: 'root' })
export class UsuariosService {

  private readonly http = inject(HttpClient);
  private readonly usuariosUrl = '/api/v1/usuarios';

  // ─── Estado reactivo ─────────────────────────────────────────────────────

  readonly isLoadingUsuarios = signal<boolean>(false);
  readonly errorUsuarios     = signal<string | null>(null);
  readonly usuarios          = signal<Usuario[]>([]);
  readonly totalUsuarios     = signal<number>(0);

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly totalUsuariosActivos = computed(
    () => this.usuarios().filter(u => u.activo).length
  );

  // ─── Usuarios ────────────────────────────────────────────────────────────

  cargarUsuarios(q?: string, page = 1, pageSize = 20): void {
    this.isLoadingUsuarios.set(true);
    this.errorUsuarios.set(null);

    const params: Record<string, string | number> = { page, pageSize };
    if (q) params['q'] = q;

    this.http.get<PageResponse<Usuario>>(this.usuariosUrl, { params }).subscribe({
      next: (data) => {
        this.usuarios.set(data.items);
        this.totalUsuarios.set(data.total);
        this.isLoadingUsuarios.set(false);
      },
      error: (err) => {
        this.errorUsuarios.set(this.mensaje(err));
        this.isLoadingUsuarios.set(false);
      },
    });
  }

  obtenerUsuario(id: string): Promise<Usuario> {
    return firstValueFrom(this.http.get<Usuario>(`${this.usuariosUrl}/${id}`));
  }

  async crearUsuario(request: UsuarioRequest): Promise<Usuario> {
    const nuevo = await firstValueFrom(
      this.http.post<Usuario>(this.usuariosUrl, request)
    );
    this.usuarios.update(list => [...list, nuevo]);
    return nuevo;
  }

  async actualizarUsuario(id: string, request: Omit<UsuarioRequest, 'password'>): Promise<Usuario> {
    const actualizado = await firstValueFrom(
      this.http.put<Usuario>(`${this.usuariosUrl}/${id}`, request)
    );
    this.usuarios.update(list => list.map(u => (u.id === id ? actualizado : u)));
    return actualizado;
  }

  async cambiarEstadoUsuario(id: string, activo: boolean): Promise<void> {
    await firstValueFrom(
      this.http.patch<{ activo: boolean }>(`${this.usuariosUrl}/${id}/estado`, { activo })
    );
    this.usuarios.update(list =>
      list.map(u => (u.id === id ? { ...u, activo } : u))
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

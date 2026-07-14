import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  PageResponse,
  Rol,
  RolRequest,
  Usuario,
  UsuarioRequest,
} from '../models/acceso.model';

/**
 * Servicio de Gestión de Accesos (IAM) con Signals + HttpClient
 * (04_BACKEND_SCHEMA §3). Solo accesible para el rol `admin-sistema`;
 * el backend (o la Fake API) valida el token y el rol en cada petición.
 */
@Injectable({ providedIn: 'root' })
export class AccesosService {

  private readonly http = inject(HttpClient);
  private readonly usuariosUrl = '/api/v1/usuarios';
  private readonly rolesUrl = '/api/v1/roles';

  // ─── Estado reactivo ─────────────────────────────────────────────────────

  readonly isLoadingUsuarios = signal<boolean>(false);
  readonly isLoadingRoles    = signal<boolean>(false);
  readonly errorUsuarios     = signal<string | null>(null);
  readonly errorRoles        = signal<string | null>(null);
  readonly usuarios          = signal<Usuario[]>([]);
  readonly roles             = signal<Rol[]>([]);
  readonly totalUsuarios     = signal<number>(0);

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly totalUsuariosActivos = computed(
    () => this.usuarios().filter(u => u.activo).length
  );
  readonly totalRoles = computed(() => this.roles().length);

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

  // ─── Roles ───────────────────────────────────────────────────────────────

  cargarRoles(): void {
    this.isLoadingRoles.set(true);
    this.errorRoles.set(null);

    this.http.get<Rol[]>(this.rolesUrl).subscribe({
      next: (data) => {
        this.roles.set(data);
        this.isLoadingRoles.set(false);
      },
      error: (err) => {
        this.errorRoles.set(this.mensaje(err));
        this.isLoadingRoles.set(false);
      },
    });
  }

  obtenerRol(id: string): Promise<Rol> {
    return firstValueFrom(this.http.get<Rol>(`${this.rolesUrl}/${id}`));
  }

  /** Usuarios que tienen asignado un rol (para el detalle de rol). */
  obtenerUsuariosDeRol(id: string): Promise<Usuario[]> {
    return firstValueFrom(this.http.get<Usuario[]>(`${this.rolesUrl}/${id}/usuarios`));
  }

  async crearRol(request: RolRequest): Promise<Rol> {
    const nuevo = await firstValueFrom(
      this.http.post<Rol>(this.rolesUrl, request)
    );
    this.roles.update(list => [...list, nuevo]);
    return nuevo;
  }

  async actualizarRol(id: string, request: RolRequest): Promise<Rol> {
    const actualizado = await firstValueFrom(
      this.http.put<Rol>(`${this.rolesUrl}/${id}`, request)
    );
    this.roles.update(list => list.map(r => (r.id === id ? actualizado : r)));
    return actualizado;
  }

  async eliminarRol(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.rolesUrl}/${id}`));
    this.roles.update(list => list.filter(r => r.id !== id));
  }

  // ─── Privados ────────────────────────────────────────────────────────────

  private mensaje(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) ?? err.message;
    }
    return 'Error de red desconocido';
  }
}

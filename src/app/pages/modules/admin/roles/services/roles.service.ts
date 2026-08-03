import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Rol, RolRequest } from '../models/rol.model';
import type { Usuario } from '../../usuarios/models/usuario.model';

/**
 * Servicio de Gestión de Roles (04_BACKEND_SCHEMA §3) con Signals + HttpClient.
 * Solo accesible para el rol `admin-sistema`; el backend valida el token y
 * el rol en cada petición.
 */
@Injectable({ providedIn: 'root' })
export class RolesService {

  private readonly http = inject(HttpClient);
  private readonly rolesUrl = '/api/v1/roles';

  // ─── Estado reactivo ─────────────────────────────────────────────────────

  readonly isLoadingRoles = signal<boolean>(false);
  readonly errorRoles     = signal<string | null>(null);
  readonly roles          = signal<Rol[]>([]);

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly totalRoles = computed(() => this.roles().length);

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

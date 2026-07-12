import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ShellStateService, UsuarioActivo } from '../../../../core/services/shell-state.service';
import type { Usuario } from '../../../modules/accesos/models/acceso.model';

// ─── Contratos del endpoint de autenticación ──────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

const SESSION_KEY = 'mis.sesion';

interface SesionPersistida {
  token: string;
  usuario: UsuarioActivo;
}

/**
 * Servicio de autenticación del Host.
 *
 * - `login()` llama a `POST /api/v1/auth/login` (atendido por la Fake API
 *   mientras no exista backend real) y publica el usuario en el ShellStateService.
 * - La sesión se persiste en `sessionStorage` para sobrevivir al refresh (F5).
 * - `restaurarSesion()` se ejecuta al arrancar la app (ver app.config.ts).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);

  private readonly baseUrl = '/api/v1/auth';

  private readonly _token = signal<string | null>(null);

  /** Token de sesión actual (lo consume el authInterceptor). */
  readonly token = this._token.asReadonly();

  // ─── Ciclo de vida de la sesión ──────────────────────────────────────────

  async login(credenciales: LoginRequest): Promise<UsuarioActivo> {
    try {
      const respuesta = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.baseUrl}/login`, credenciales)
      );

      const usuarioActivo: UsuarioActivo = {
        id: respuesta.usuario.id,
        nombre: respuesta.usuario.nombre,
        email: respuesta.usuario.email,
        rol: respuesta.usuario.rol,
        subsistemas: respuesta.usuario.subsistemas,
      };

      this._token.set(respuesta.token);
      this.shell.setUsuarioActivo(usuarioActivo);
      this.persistir({ token: respuesta.token, usuario: usuarioActivo });

      return usuarioActivo;
    } catch (err) {
      throw new Error(this.mensajeDeError(err));
    }
  }

  /** Restaura la sesión persistida al recargar la página. */
  restaurarSesion(): void {
    const crudo = sessionStorage.getItem(SESSION_KEY);
    if (!crudo) return;

    try {
      const sesion = JSON.parse(crudo) as SesionPersistida;
      if (sesion?.token && sesion?.usuario?.id) {
        this._token.set(sesion.token);
        this.shell.setUsuarioActivo(sesion.usuario);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  cerrarSesion(redirigir = true): void {
    this._token.set(null);
    this.shell.cerrarSesion();
    sessionStorage.removeItem(SESSION_KEY);
    if (redirigir) {
      this.router.navigate(['/login']);
    }
  }

  // ─── Privados ────────────────────────────────────────────────────────────

  private persistir(sesion: SesionPersistida): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  }

  private mensajeDeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
      }
      return (err.error?.message as string) ?? 'Error de autenticación.';
    }
    return 'Ocurrió un error inesperado al iniciar sesión.';
  }
}

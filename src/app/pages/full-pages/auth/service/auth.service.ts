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

/** Respuesta del primer paso: credenciales válidas → desafío MFA (CA-07). */
export interface MfaChallengeResponse {
  mfaRequerido: boolean;
  mfaToken: string;
  email: string;
}

/** Respuesta del segundo paso: OTP válido → sesión emitida. */
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
 * Servicio de autenticación del Host — flujo MFA en dos pasos (CA-07).
 *
 * 1. `login()` → `POST /api/v1/auth/login`: valida credenciales y devuelve
 *    un desafío MFA (`mfaToken`). Todavía NO hay sesión.
 * 2. `verificarOtp()` → `POST /api/v1/auth/verificar-otp`: valida el código
 *    de 6 dígitos, emite el token de sesión y publica el usuario en el
 *    ShellStateService.
 *
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
  private mfaToken: string | null = null;

  /** Token de sesión actual (lo consume el authInterceptor). */
  readonly token = this._token.asReadonly();

  // ─── Ciclo de vida de la sesión ──────────────────────────────────────────

  /** Paso 1: valida credenciales y devuelve el desafío MFA (sin sesión aún). */
  async login(credenciales: LoginRequest): Promise<MfaChallengeResponse> {
    try {
      const desafio = await firstValueFrom(
        this.http.post<MfaChallengeResponse>(`${this.baseUrl}/login`, credenciales)
      );
      this.mfaToken = desafio.mfaToken;
      return desafio;
    } catch (err) {
      throw new Error(this.mensajeDeError(err));
    }
  }

  /** Paso 2: verifica el código OTP de 6 dígitos y establece la sesión. */
  async verificarOtp(otp: string): Promise<UsuarioActivo> {
    try {
      const respuesta = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.baseUrl}/verificar-otp`, {
          mfaToken: this.mfaToken,
          otp,
        })
      );

      const usuarioActivo: UsuarioActivo = {
        id: respuesta.usuario.id,
        nombre: respuesta.usuario.nombre,
        email: respuesta.usuario.email,
        rol: respuesta.usuario.rol,
        subsistemas: respuesta.usuario.subsistemas,
      };

      this.mfaToken = null;
      this._token.set(respuesta.token);
      this.shell.setUsuarioActivo(usuarioActivo);
      this.persistir({ token: respuesta.token, usuario: usuarioActivo });

      return usuarioActivo;
    } catch (err) {
      throw new Error(this.mensajeDeError(err));
    }
  }

  /** Cancela un desafío MFA en curso (volver al paso de credenciales). */
  cancelarMfa(): void {
    this.mfaToken = null;
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

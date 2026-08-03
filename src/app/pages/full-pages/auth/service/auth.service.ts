import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { ModSysLoginService } from '../../../../core/winder/instances/mod-sys-login.service';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { IWinderResponse } from '../../../../core/winder/winder.interface';

export interface LoginRequest {
  email: string;
}

const SESSION_KEY = 'mis.sesion';

interface SesionPersistida {
  token: string; // The session_id or token from Winder
  usuario: UsuarioActivo;
}

/**
 * Servicio de autenticación del Host — Integrado con Winder.
 *
 * 1. `login()` → Utiliza ModSysLoginService para validar el correo y
 *    obtener la sesión desde el backend Ant (STG).
 *
 * - La sesión se persiste en `sessionStorage` para sobrevivir al refresh (F5).
 * - `restaurarSesion()` se ejecuta al arrancar la app.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);
  private readonly modSysLoginService = inject(ModSysLoginService);

  private readonly _token = signal<string | null>(null);

  /** Token de sesión actual */
  readonly token = this._token.asReadonly();

  // ─── Ciclo de vida de la sesión ──────────────────────────────────────────

  /** Valida credenciales contra backend Ant y establece sesión. */
  async login(credenciales: LoginRequest): Promise<UsuarioActivo> {
    try {
      const respuesta = await firstValueFrom(
        this.modSysLoginService.login(credenciales.email)
      );
      
      // Mapear respuesta de Winder (STG pattern) a UsuarioActivo
      // Ajusta las propiedades de "body" de acuerdo a lo que devuelve el backend real
      const body = respuesta.body as any;
      
      const usuarioActivo: UsuarioActivo = {
        id: body.id || credenciales.email,
        nombre: body.name || body.nombre || credenciales.email.split('@')[0],
        email: credenciales.email,
        rol: body.role || 'admin-sistema', // Default role if not provided
        subsistemas: body.systems || [],
      };

      const sessionToken = body.session_id || 'winder-session-token';

      this._token.set(sessionToken);
      this.shell.setUsuarioActivo(usuarioActivo);
      this.persistir({ token: sessionToken, usuario: usuarioActivo });

      return usuarioActivo;
    } catch (err: any) {
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

  private mensajeDeError(err: any): string {
    if (err?.message) {
      return err.message;
    }
    return 'Ocurrió un error inesperado al iniciar sesión.';
  }
}


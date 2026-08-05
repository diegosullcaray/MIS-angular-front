import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { ModSysLoginService } from '../../../../core/winder/instances/mod-sys-login.service';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import { environment } from '../../../../../environments/environment';
import { googleAuthConfig } from './google-auth.config';

const SESSION_KEY = 'mis.sesion';

/** Vigencia de la sesión desde el login (o desde el último restore) — pasado esto, se expulsa al login con la pantalla de "Sesión expirada". */
const DURACION_SESION_MS = 15 * 60 * 1000;

interface SesionPersistida {
  token: string; // El session_id o token devuelto por Winder
  usuario: UsuarioActivo;
  /** Epoch ms a partir del cual la sesión deja de ser válida. */
  expiraEn: number;
}

interface ClaimsGoogle {
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Forma real de la respuesta del backend Ant para `login` (módulo
 * `session`, ver `ModSysLoginService`) — migrada tal cual del STG
 * (`login.service.ts` → `processLogin`). El backend NUNCA devuelve campos
 * planos (`id`/`name`/`role`) en la raíz del body: todo vive anidado bajo
 * `login_response.profile`.
 */
interface LoginResponseBody {
  login_response?: {
    profile?: {
      email?: string;
      nombre?: string;
      /** Código de negocio/agencia — lo requieren varios módulos de STG (ej. Kaypacha). */
      cod_bt?: string;
      /** Tipo de usuario: 0 = administrador. STG no tiene una jerarquía de 3 niveles. */
      tip_use?: number;
      pic_url?: string;
    };
    /** Token/ID de sesión que Winder emite tras un login exitoso. */
    sid?: string;
    token?: string;
  };
}

/**
 * Servicio de autenticación del Host — Google Sign-In + Winder (STG).
 *
 * 1. `iniciarLoginGoogle()` redirige a Google (Implicit Flow, igual que STG).
 * 2. `completarLoginGoogle()` corre al volver del redirect: valida el
 *    `id_token` recibido y autentica el email contra el backend Ant.
 * 3. Fuera de producción, el email autenticado se reemplaza por
 *    `environment.devUser` — el mismo mecanismo que `UserService` aplica en
 *    STG para que el equipo de desarrollo no dependa de una cuenta Google
 *    real ni de tipear nada a mano.
 *
 * La sesión resultante se persiste en `sessionStorage` para sobrevivir al
 * refresh (F5).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);
  private readonly modSysLoginService = inject(ModSysLoginService);
  private readonly oauthService = inject(OAuthService);

  private readonly _token = signal<string | null>(null);
  private timerExpiracion: ReturnType<typeof setTimeout> | null = null;

  /** Token de sesión actual */
  readonly token = this._token.asReadonly();

  constructor() {
    this.oauthService.configure(googleAuthConfig);
  }

  // ─── Google Sign-In ──────────────────────────────────────────────────────

  /** Redirige al usuario a Google para iniciar el flujo de autenticación. */
  iniciarLoginGoogle(): void {
    this.oauthService.initImplicitFlow();
  }

  /**
   * Completa el flujo de Google tras el redirect: carga el discovery
   * document, procesa el hash de la URL y, si hay un `id_token` válido,
   * autentica contra el backend Ant.
   *
   * Devuelve `null` cuando todavía no hay sesión de Google (primera visita
   * a `/login`, antes de que el usuario elija iniciar sesión).
   */
  async completarLoginGoogle(): Promise<UsuarioActivo | null> {
    await this.oauthService.loadDiscoveryDocument();
    await this.oauthService.tryLogin();

    if (!this.oauthService.hasValidIdToken()) {
      return null;
    }

    const claims = this.oauthService.getIdentityClaims() as ClaimsGoogle;
    const email = !environment.production && environment.devUser ? environment.devUser : claims.email;

    return this.autenticar({ email, nombre: claims.name, avatarUrl: claims.picture });
  }

  // ─── Ciclo de vida de la sesión ──────────────────────────────────────────

  /** Valida el email contra el backend Ant y establece la sesión. */
  private async autenticar(datos: { email: string; nombre?: string; avatarUrl?: string }): Promise<UsuarioActivo> {
    try {
      const respuesta = await firstValueFrom<IWinderResponse>(this.modSysLoginService.login(datos.email));

      const body = respuesta.body as LoginResponseBody;
      const lr = body.login_response;
      const profile = lr?.profile;

      if (!profile) {
        throw new Error('El backend no devolvió un perfil de usuario válido.');
      }

      const usuarioActivo: UsuarioActivo = {
        id: profile.email || datos.email,
        nombre: profile.nombre || datos.nombre || datos.email.split('@')[0],
        email: profile.email || datos.email,
        // STG solo distingue administrador (tip_use === 0) del resto — no
        // tiene la jerarquía de 3 niveles de este Host. Se mapea al nivel
        // más conservador (supervisor-area) para cualquier no-administrador.
        rol: profile.tip_use === 0 ? 'admin-sistema' : 'supervisor-area',
        subsistemas: [],
        avatarUrl: datos.avatarUrl || profile.pic_url,
        codBt: profile.cod_bt,
      };

      const sessionToken = lr?.sid || lr?.token || 'winder-session-token';

      this._token.set(sessionToken);
      this.shell.setUsuarioActivo(usuarioActivo);
      this.persistir({ token: sessionToken, usuario: usuarioActivo });

      return usuarioActivo;
    } catch (err: any) {
      throw new Error(this.mensajeDeError(err));
    }
  }

  /** Restaura la sesión persistida al recargar la página — si ya venció, la descarta y muestra la pantalla de "Sesión expirada". */
  restaurarSesion(): void {
    const crudo = sessionStorage.getItem(SESSION_KEY);
    if (!crudo) return;

    try {
      const sesion = JSON.parse(crudo) as SesionPersistida;
      if (!sesion?.token || !sesion?.usuario?.id) return;

      if (typeof sesion.expiraEn === 'number' && Date.now() >= sesion.expiraEn) {
        sessionStorage.removeItem(SESSION_KEY);
        this.router.navigateByUrl('/error/401');
        return;
      }

      this._token.set(sesion.token);
      this.shell.setUsuarioActivo(sesion.usuario);
      if (typeof sesion.expiraEn === 'number') {
        this.programarExpiracion(sesion.expiraEn);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  cerrarSesion(redirigir = true): void {
    this.oauthService.logOut();
    this.limpiarSesion();
    if (redirigir) {
      this.router.navigate(['/login']);
    }
  }

  // ─── Privados ────────────────────────────────────────────────────────────

  private persistir(sesion: Omit<SesionPersistida, 'expiraEn'>): void {
    const expiraEn = Date.now() + DURACION_SESION_MS;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...sesion, expiraEn }));
    this.programarExpiracion(expiraEn);
  }

  /** Programa (o reprograma) la expulsión automática cuando se cumpla `expiraEn`, aunque el usuario siga navegando sin recargar. */
  private programarExpiracion(expiraEn: number): void {
    this.limpiarTimerExpiracion();

    const restante = expiraEn - Date.now();
    if (restante <= 0) {
      this.expirarPorTiempo();
      return;
    }
    this.timerExpiracion = setTimeout(() => this.expirarPorTiempo(), restante);
  }

  private limpiarTimerExpiracion(): void {
    if (this.timerExpiracion !== null) {
      clearTimeout(this.timerExpiracion);
      this.timerExpiracion = null;
    }
  }

  /** Se cumplieron los 15 minutos con la sesión abierta: borra credenciales y manda a la pantalla de "Sesión expirada" (no a /login directo). */
  private expirarPorTiempo(): void {
    this.oauthService.logOut();
    this.limpiarSesion();
    this.router.navigateByUrl('/error/401');
  }

  private limpiarSesion(): void {
    this._token.set(null);
    this.shell.cerrarSesion();
    sessionStorage.removeItem(SESSION_KEY);
    this.limpiarTimerExpiracion();
  }

  private mensajeDeError(err: any): string {
    if (err?.message) {
      return err.message;
    }
    return 'Ocurrió un error inesperado al iniciar sesión.';
  }
}

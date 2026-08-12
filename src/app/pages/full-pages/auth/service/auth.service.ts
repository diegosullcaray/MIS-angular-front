import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { ModSysLoginService } from '../../../../core/winder/instances/mod-sys-login.service';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { AlternateUsuario } from '../model/alternate-usuario.model';
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
  /** Usuarios alternos disponibles para `usuario` (backend, `alternates`). */
  alternates?: AlternateUsuario[];
  /**
   * Identidad original mientras `usuario` es un usuario alterno (ver
   * `cambiarAUsuarioAlterno`). El token de sesión NO cambia al alternar —
   * solo lo que se muestra/opera, igual que STG (`UserService.original()`).
   */
  usuarioOriginal?: UsuarioActivo;
}

interface ClaimsGoogle {
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Perfil que devuelve `login` (módulo `session`).
 * Siempre anidado bajo `login_response.profile`, nunca plano en la raíz del body.
 */
interface PerfilRaw {
  email?: string;
  nombre?: string;
  /** Código de negocio/agencia — lo requieren varios módulos de STG (ej. Kaypacha). */
  cod_bt?: string;
  /** Tipo de usuario: 0 = administrador. STG no tiene una jerarquía de 3 niveles. */
  tip_use?: number;
  pic_url?: string;
  /** Fecha de corte de campaña (`YYYYMMDD`) — usada por Incentivos/Presupuesto en vez de la fecha real. */
  curr_fec?: string;
  /** Fechas de corte re-consultables, separadas por coma (`YYYYMMDD` cada una) — selector de fecha de Incentivos. */
  hab_fec?: string;
}

/** Un usuario alterno tal como lo devuelve el backend (`login_response.alternates`). */
interface AlternateRaw {
  email_alt?: string;
  nombre_alt?: string;
  cargo_alt?: string;
}

interface LoginResponseBody {
  login_response?: {
    profile?: PerfilRaw;
    /** Usuarios a los que este usuario está autorizado a cambiarse (ver `AdminService.openAltUserDialog` en STG). */
    alternates?: AlternateRaw[];
    /** Token/ID de sesión que Winder emite tras un login exitoso. */
    sid?: string;
    token?: string;
  };
}

/**
 * Autenticación del Host: Google Sign-In (Implicit Flow) + backend Ant.
 *
 * `iniciarLoginGoogle()` redirige a Google; `completarLoginGoogle()` corre al
 * volver, valida el `id_token` y autentica el email contra Ant. Fuera de
 * producción `environment.devUser` reemplaza al email autenticado.
 *
 * La sesión se persiste en `sessionStorage` para sobrevivir al refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);
  private readonly modSysLoginService = inject(ModSysLoginService);
  private readonly oauthService = inject(OAuthService);

  private readonly _token = signal<string | null>(null);
  private timerExpiracion: ReturnType<typeof setTimeout> | null = null;

  private readonly _alternates = signal<AlternateUsuario[]>([]);
  /** Identidad original mientras se está "viendo como" un usuario alterno; `null` en operación normal. */
  private readonly _usuarioOriginal = signal<UsuarioActivo | null>(null);

  /** Token de sesión actual */
  readonly token = this._token.asReadonly();

  /** Usuarios a los que el usuario actual puede cambiarse (vacío si no tiene ninguno asignado). */
  readonly alternates = this._alternates.asReadonly();

  /** `true` mientras se está operando como un usuario alterno (ver `cambiarAUsuarioAlterno`). */
  readonly esUsuarioAlterno = computed(() => this._usuarioOriginal() !== null);

  /** Puede abrir el diálogo de "Cambiar usuario": no está ya en modo alterno y tiene al menos un alterno asignado. */
  readonly puedeCambiarUsuario = computed(() => !this.esUsuarioAlterno() && this._alternates().length > 0);

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

      const usuarioActivo = this.mapearUsuario(profile, datos);
      const alternates = this.mapearAlternates(lr?.alternates);
      const sessionToken = lr?.sid || lr?.token || 'winder-session-token';

      this._token.set(sessionToken);
      this._alternates.set(alternates);
      this._usuarioOriginal.set(null);
      this.shell.setUsuarioActivo(usuarioActivo);
      this.persistir({ token: sessionToken, usuario: usuarioActivo, alternates });

      return usuarioActivo;
    } catch (err: any) {
      throw new Error(this.mensajeDeError(err));
    }
  }

  /** Traduce el `profile` crudo del backend Ant a `UsuarioActivo`. */
  private mapearUsuario(profile: PerfilRaw, datos: { email: string; nombre?: string; avatarUrl?: string }): UsuarioActivo {
    return {
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
      fechaCorte: profile.curr_fec,
      fechasHabilitadas: profile.hab_fec,
    };
  }

  /** Traduce los `alternates` crudos del backend Ant a `AlternateUsuario[]`, descartando entradas sin email. */
  private mapearAlternates(alternates?: AlternateRaw[]): AlternateUsuario[] {
    if (!alternates) return [];
    return alternates
      .filter((a): a is AlternateRaw & { email_alt: string } => !!a.email_alt)
      .map((a) => ({ email: a.email_alt, nombre: a.nombre_alt || a.email_alt, cargo: a.cargo_alt }));
  }

  /**
   * Cambia a ver la aplicación como un usuario alterno (STG:
   * `AltUserDialogComponent.actionPerformed` → `LoginService.onAltLogin`).
   * El token/sid de sesión NO cambia — solo el perfil mostrado y operado.
   */
  async cambiarAUsuarioAlterno(alterno: AlternateUsuario): Promise<void> {
    const usuarioActual = this.shell.usuarioActivo();
    if (!usuarioActual) return;

    try {
      const respuesta = await firstValueFrom<IWinderResponse>(this.modSysLoginService.altLogin(alterno.email));
      const body = respuesta.body as LoginResponseBody;
      const profile = body.login_response?.profile;

      if (!profile) {
        throw new Error('El backend no devolvió un perfil de usuario válido.');
      }

      const usuarioAlterno = this.mapearUsuario(profile, { email: alterno.email, nombre: alterno.nombre });

      this._usuarioOriginal.set(usuarioActual);
      this.shell.setUsuarioActivo(usuarioAlterno);
      this.actualizarSesionPersistida(usuarioAlterno, usuarioActual);
    } catch (err: any) {
      throw new Error(this.mensajeDeError(err));
    }
  }

  /**
   * Vuelve a la identidad original desde un usuario alterno (STG:
   * `LoginService.onOriLogin`) — sin llamada al backend, la identidad
   * original ya está en memoria desde `cambiarAUsuarioAlterno`.
   */
  volverAUsuarioOriginal(): void {
    const original = this._usuarioOriginal();
    if (!original) return;

    this._usuarioOriginal.set(null);
    this.shell.setUsuarioActivo(original);
    this.actualizarSesionPersistida(original, null);
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
      this._alternates.set(sesion.alternates ?? []);
      this._usuarioOriginal.set(sesion.usuarioOriginal ?? null);
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

  /**
   * Actualiza el usuario mostrado (y, si aplica, la identidad original) al
   * cambiar/revertir un usuario alterno, preservando `expiraEn` intacto — el
   * cronómetro de los 15 minutos sigue siendo el de la sesión original, tal
   * como en STG (cambiar de usuario no reinicia la sesión).
   */
  private actualizarSesionPersistida(usuario: UsuarioActivo, usuarioOriginal: UsuarioActivo | null): void {
    const crudo = sessionStorage.getItem(SESSION_KEY);
    if (!crudo) return;

    try {
      const sesion = JSON.parse(crudo) as SesionPersistida;
      sesion.usuario = usuario;
      sesion.usuarioOriginal = usuarioOriginal ?? undefined;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
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
    this._alternates.set([]);
    this._usuarioOriginal.set(null);
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

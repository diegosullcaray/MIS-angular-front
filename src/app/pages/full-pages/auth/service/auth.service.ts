import { Injectable, inject, isDevMode, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { LimpiezaSesionService } from '../../../../core/preferencias/aplicacion/limpieza-sesion.service';
import { JerarquiaCacheService } from '../../../../shared/ui/hier-selector/jerarquia-cache.service';
import { ModSysLoginService } from '../../../../core/winder/instances/mod-sys-login.service';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import { environment } from '../../../../../environments/environment';
import { googleAuthConfig } from './google-auth.config';
import { SESSION_KEY, DURACION_SESION_MS } from '../../../../app.global';
import { AlternateUsuario } from '../model/auth-session.model';
import type { SesionPersistida } from '../model/auth-session.model';
import { AlternateRaw, LoginResponseBody, PerfilRaw } from '../model/auth-api.model';

/** Servicio de Autenticación: Google Sign-In + Backend Ant */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);
  private readonly modSysLoginService = inject(ModSysLoginService);
  private readonly oauthService = inject(OAuthService);
  private readonly limpieza = inject(LimpiezaSesionService);
  private readonly jerarquiaCache = inject(JerarquiaCacheService);

  private readonly _token = signal<string | null>(null);
  private readonly _alternates = signal<AlternateUsuario[]>([]);
  private readonly _usuarioOriginal = signal<UsuarioActivo | null>(null);
  private timerExpiracion: ReturnType<typeof setTimeout> | null = null;

  readonly token = this._token.asReadonly();
  readonly alternates = this._alternates.asReadonly();
  /** Identidad propia mientras se está viendo como un alterno (null si no). */
  readonly usuarioOriginal = this._usuarioOriginal.asReadonly();
  
  /** Indica si se está operando como un usuario alterno. */
  readonly esUsuarioAlterno = computed(() => this._usuarioOriginal() !== null);
  
  /** Habilita el cambio de usuario: no está en modo alterno y tiene alternos asignados. */
  readonly puedeCambiarUsuario = computed(() => !this.esUsuarioAlterno() && this._alternates().length > 0);

  constructor() {
    this.oauthService.configure(googleAuthConfig);
  }

  // ─── Google Sign-In ──────────────────────────────────────────────────────

  iniciarLoginGoogle(): void {
    this.oauthService.initImplicitFlow();
  }

  async completarLoginGoogle(): Promise<UsuarioActivo | null> {
    await this.oauthService.loadDiscoveryDocument();
    await this.oauthService.tryLogin();

    if (!this.oauthService.hasValidIdToken()) return null;

    const claims = this.oauthService.getIdentityClaims() as Record<string, any>;
    const email = this.emailDePrueba() ?? claims['email'];

    return this.autenticar({ email, nombre: claims['name'], avatarUrl: claims['picture'] });
  }

  /** Identidad suplantada para pruebas locales, o `null` fuera de desarrollo. */
  private emailDePrueba(): string | null {
    if (!isDevMode()) return null;
    return localStorage.getItem('mis.devUser') || environment.devUser || null;
  }

  // ─── Ciclo de vida de la sesión ──────────────────────────────────────────

  private async autenticar(datos: { email: string; nombre?: string; avatarUrl?: string }): Promise<UsuarioActivo> {
    try {
      const lr = await this.procesarLogin(this.modSysLoginService.login(datos.email));
      const usuarioActivo = this.mapearUsuario(lr.profile!, datos);
      const alternates = this.mapearAlternates(lr.alternates);
      const sessionToken = lr.sid || lr.token || 'winder-session-token';

      this._token.set(sessionToken);
      this._alternates.set(alternates);
      this._usuarioOriginal.set(null);
      this.shell.setUsuarioActivo(usuarioActivo);
      
      this.persistir({ token: sessionToken, usuario: usuarioActivo, alternates });

      return usuarioActivo;
    } catch (err: any) {
      throw new Error(err?.message || 'Error inesperado al iniciar sesión.');
    }
  }

  async cambiarAUsuarioAlterno(alterno: AlternateUsuario): Promise<void> {
    const usuarioActual = this.shell.usuarioActivo();
    if (!usuarioActual) return;

    try {
      const lr = await this.procesarLogin(this.modSysLoginService.altLogin(alterno.email));
      const usuarioAlterno = this.mapearUsuario(lr.profile!, { email: alterno.email, nombre: alterno.nombre });

      // El árbol organizativo depende de quién mira: el del alterno no es el propio.
      this.jerarquiaCache.limpiar();
      this._usuarioOriginal.set(usuarioActual);
      this.shell.setUsuarioActivo(usuarioAlterno);
      this.actualizarSesionPersistida(usuarioAlterno, usuarioActual);
    } catch (err: any) {
      throw new Error(err?.message || 'Error al cambiar de usuario.');
    }
  }

  volverAUsuarioOriginal(): void {
    const original = this._usuarioOriginal();
    if (!original) return;

    this.jerarquiaCache.limpiar();
    this._usuarioOriginal.set(null);
    this.shell.setUsuarioActivo(original);
    this.actualizarSesionPersistida(original, null);
  }

  restaurarSesion(): void {
    const crudo = sessionStorage.getItem(SESSION_KEY);
    if (!crudo) return;

    try {
      const sesion = JSON.parse(crudo) as SesionPersistida;
      if (!sesion?.token || !sesion?.usuario?.id) return;

      if (sesion.expiraEn && Date.now() >= sesion.expiraEn) {
        void this.cerrarSesion('/error/401');
        return;
      }

      this._token.set(sesion.token);
      this._alternates.set(sesion.alternates ?? []);
      this._usuarioOriginal.set(sesion.usuarioOriginal ?? null);
      this.shell.setUsuarioActivo(sesion.usuario);
      
      if (sesion.expiraEn) this.programarExpiracion(sesion.expiraEn);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  /**
   * Cierra la sesión y deja el navegador limpio: `localStorage`,
   * `sessionStorage`, cookies, cachés de la PWA y service workers. En un equipo
   * compartido el siguiente usuario no debe encontrar nada del anterior, por eso
   * el borrado es total y no una lista de claves conocidas.
   *
   * Se navega al login DESPUÉS del borrado para no dejarlo a medias; si algo
   * falla, se navega igual — quedarse en la sesión sería peor.
   */
  async cerrarSesion(rutaDestino = '/login'): Promise<void> {
    this.oauthService.logOut();
    this._token.set(null);
    this._alternates.set([]);
    this._usuarioOriginal.set(null);
    this.shell.cerrarSesion();
    this.limpiarTimerExpiracion();

    try {
      await this.limpieza.limpiarTodo();
    } catch {
      // El borrado ya es de mejor esfuerzo por dentro; que falle no puede
      // impedir que el usuario quede fuera de la sesión.
    }

    if (rutaDestino) await this.router.navigateByUrl(rutaDestino);
  }

  // ─── Privados ────────────────────────────────────────────────────────────

  /** Ejecuta la petición al backend y extrae/valida el login_response */
  private async procesarLogin(peticion: any) {
    const respuesta = await firstValueFrom<IWinderResponse>(peticion);
    const lr = (respuesta.body as LoginResponseBody)?.login_response;
    if (!lr?.profile) throw new Error('El backend no devolvió un perfil válido.');
    return lr;
  }

  private mapearUsuario(profile: PerfilRaw, datos: { email: string; nombre?: string; avatarUrl?: string }): UsuarioActivo {
    return {
      id: profile.email || datos.email,
      nombre: profile.nombre || datos.nombre || datos.email.split('@')[0],
      email: profile.email || datos.email,
      rol: profile.tip_use === 0 ? 'admin-sistema' : 'supervisor-area',
      subsistemas: [],
      avatarUrl: datos.avatarUrl || profile.pic_url,
      codBt: profile.cod_bt,
      fechaCorte: profile.curr_fec,
      fechasHabilitadas: profile.hab_fec,
      numDoc: profile.num_doc,
    };
  }

  private mapearAlternates(alternates?: AlternateRaw[]): AlternateUsuario[] {
    return (alternates || [])
      .filter(a => !!a.email_alt)
      .map(a => ({ email: a.email_alt!, nombre: a.nombre_alt || a.email_alt!, cargo: a.cargo_alt }));
  }

  private persistir(sesion: Omit<SesionPersistida, 'expiraEn'>): void {
    const expiraEn = Date.now() + DURACION_SESION_MS;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...sesion, expiraEn }));
    this.programarExpiracion(expiraEn);
  }

  private actualizarSesionPersistida(usuario: UsuarioActivo, usuarioOriginal: UsuarioActivo | null): void {
    try {
      const crudo = sessionStorage.getItem(SESSION_KEY);
      if (!crudo) return;
      
      const sesion = JSON.parse(crudo) as SesionPersistida;
      sesion.usuario = usuario;
      sesion.usuarioOriginal = usuarioOriginal ?? undefined;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  private programarExpiracion(expiraEn: number): void {
    this.limpiarTimerExpiracion();
    const restante = expiraEn - Date.now();
    
    if (restante <= 0) {
      void this.cerrarSesion('/error/401');
    } else {
      this.timerExpiracion = setTimeout(() => void this.cerrarSesion('/error/401'), restante);
    }
  }

  private limpiarTimerExpiracion(): void {
    if (this.timerExpiracion) {
      clearTimeout(this.timerExpiracion);
      this.timerExpiracion = null;
    }
  }
}
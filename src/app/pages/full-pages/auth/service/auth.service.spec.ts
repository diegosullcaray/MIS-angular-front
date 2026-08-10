import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { ModSysLoginService } from '../../../../core/winder/instances/mod-sys-login.service';
import { environment } from '../../../../../environments/environment';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';

const RESPUESTA_LOGIN: IWinderResponse = {
  code: '0',
  headers: {},
  body: {
    login_response: {
      profile: {
        email: environment.devUser,
        nombre: 'Ana Torres',
        cod_bt: 'BT-001',
        tip_use: 0,
      },
      sid: 'winder-sid-1',
      alternates: [
        { email_alt: 'carlos.ruiz@confianza.pe', nombre_alt: 'Carlos Ruiz', cargo_alt: 'Supervisor' },
      ],
    },
  },
};

const RESPUESTA_ALT_LOGIN: IWinderResponse = {
  code: '0',
  headers: {},
  body: {
    login_response: {
      profile: {
        email: 'carlos.ruiz@confianza.pe',
        nombre: 'Carlos Ruiz',
        cod_bt: 'BT-002',
        tip_use: 1,
      },
    },
  },
};

function crearOAuthServiceFalso(overrides: Partial<Record<keyof OAuthService, unknown>> = {}) {
  return {
    configure: vi.fn(),
    initImplicitFlow: vi.fn(),
    loadDiscoveryDocument: vi.fn().mockResolvedValue(undefined),
    tryLogin: vi.fn().mockResolvedValue(true),
    hasValidIdToken: vi.fn().mockReturnValue(false),
    getIdentityClaims: vi.fn().mockReturnValue({}),
    logOut: vi.fn(),
    ...overrides,
  } as unknown as OAuthService;
}

describe('AuthService', () => {
  let service: AuthService;
  let shell: ShellStateService;
  let router: Router;
  let modSysLoginService: { login: ReturnType<typeof vi.fn>; altLogin: ReturnType<typeof vi.fn> };
  let oauthServiceFalso: ReturnType<typeof crearOAuthServiceFalso>;

  function configurar(oauthOverrides: Partial<Record<keyof OAuthService, unknown>> = {}) {
    modSysLoginService = {
      login: vi.fn().mockReturnValue(of(RESPUESTA_LOGIN)),
      altLogin: vi.fn().mockReturnValue(of(RESPUESTA_ALT_LOGIN)),
    };
    oauthServiceFalso = crearOAuthServiceFalso(oauthOverrides);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ModSysLoginService, useValue: modSysLoginService },
        { provide: OAuthService, useValue: oauthServiceFalso },
      ],
    });
    service = TestBed.inject(AuthService);
    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
  }

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completarLoginGoogle() devuelve null si todavía no hay un id_token válido de Google', async () => {
    configurar({ hasValidIdToken: vi.fn().mockReturnValue(false) });

    const resultado = await service.completarLoginGoogle();

    expect(resultado).toBeNull();
    expect(modSysLoginService.login).not.toHaveBeenCalled();
    expect(shell.usuarioActivo()).toBeNull();
  });

  it('completarLoginGoogle() autentica contra Winder y publica el usuario en ShellStateService', async () => {
    configurar({
      hasValidIdToken: vi.fn().mockReturnValue(true),
      getIdentityClaims: vi.fn().mockReturnValue({ email: 'ana.torres@confianza.pe', name: 'Ana Torres' }),
    });

    const usuario = await service.completarLoginGoogle();

    // Fuera de producción, environment.devUser reemplaza al email real de
    // Google — el mismo mecanismo "login hardcodeado para desarrollo" que
    // usa UserService en STG, para no depender de una cuenta Google real.
    expect(environment.production).toBe(false);
    expect(environment.devUser).toBeTruthy();
    expect(modSysLoginService.login).toHaveBeenCalledWith(environment.devUser);

    expect(usuario?.id).toBe(environment.devUser);
    expect(usuario?.email).toBe(environment.devUser);
    expect(usuario?.codBt).toBe('BT-001');
    expect(shell.usuarioActivo()?.id).toBe(environment.devUser);
    expect(service.token()).toBe('winder-sid-1');
    expect(sessionStorage.getItem('mis.sesion')).toContain('winder-sid-1');

    const persistida = JSON.parse(sessionStorage.getItem('mis.sesion')!);
    expect(persistida.expiraEn).toBeGreaterThan(Date.now() + 14 * 60 * 1000);
    expect(persistida.expiraEn).toBeLessThanOrEqual(Date.now() + 15 * 60 * 1000);
  });

  it('borra las credenciales de sessionStorage y redirige a "Sesión expirada" (401) automáticamente a los 15 min de login, sin necesidad de recargar', async () => {
    vi.useFakeTimers();
    configurar({
      hasValidIdToken: vi.fn().mockReturnValue(true),
      getIdentityClaims: vi.fn().mockReturnValue({ email: 'ana.torres@confianza.pe' }),
    });
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await service.completarLoginGoogle();
    expect(shell.usuarioActivo()).not.toBeNull();

    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(shell.usuarioActivo()).toBeNull();
    expect(service.token()).toBeNull();
    expect(sessionStorage.getItem('mis.sesion')).toBeNull();
    expect(navSpy).toHaveBeenCalledWith('/error/401');
  });

  it('completarLoginGoogle() traduce un error del backend Ant en un mensaje legible', async () => {
    configurar({
      hasValidIdToken: vi.fn().mockReturnValue(true),
      getIdentityClaims: vi.fn().mockReturnValue({ email: 'ana.torres@confianza.pe' }),
    });
    modSysLoginService.login.mockReturnValue(throwError(() => new Error('Backend no disponible')));

    await expect(service.completarLoginGoogle()).rejects.toThrow('Backend no disponible');
    expect(shell.usuarioActivo()).toBeNull();
  });

  it('restaurarSesion() recupera la sesión persistida en sessionStorage', () => {
    configurar();
    sessionStorage.setItem(
      'mis.sesion',
      JSON.stringify({
        token: 'jwt-persistido',
        usuario: {
          id: 'u-1',
          nombre: 'Ana Torres',
          email: 'ana.torres@confianza.pe',
          rol: 'admin-sistema',
          subsistemas: ['subsistema-reportes'],
        },
      })
    );

    service.restaurarSesion();

    expect(service.token()).toBe('jwt-persistido');
    expect(shell.usuarioActivo()?.id).toBe('u-1');
  });

  it('restaurarSesion() descarta y redirige a "Sesión expirada" (401) si la sesión ya venció (pasaron los 15 min)', () => {
    configurar();
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    sessionStorage.setItem(
      'mis.sesion',
      JSON.stringify({
        token: 'jwt-viejo',
        usuario: { id: 'u-1', nombre: 'Ana Torres', email: 'ana.torres@confianza.pe', rol: 'admin-sistema', subsistemas: [] },
        expiraEn: Date.now() - 1, // ya venció
      })
    );

    service.restaurarSesion();

    expect(shell.usuarioActivo()).toBeNull();
    expect(service.token()).toBeNull();
    expect(sessionStorage.getItem('mis.sesion')).toBeNull();
    expect(navSpy).toHaveBeenCalledWith('/error/401');
  });

  it('restaurarSesion() reprograma la expulsión automática con el tiempo restante de una sesión aún vigente', () => {
    vi.useFakeTimers();
    configurar();
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    sessionStorage.setItem(
      'mis.sesion',
      JSON.stringify({
        token: 'jwt-vigente',
        usuario: { id: 'u-1', nombre: 'Ana Torres', email: 'ana.torres@confianza.pe', rol: 'admin-sistema', subsistemas: [] },
        expiraEn: Date.now() + 5000, // quedan 5s de los 15min originales
      })
    );

    service.restaurarSesion();
    expect(shell.usuarioActivo()?.id).toBe('u-1');

    vi.advanceTimersByTime(5000);

    expect(shell.usuarioActivo()).toBeNull();
    expect(sessionStorage.getItem('mis.sesion')).toBeNull();
    expect(navSpy).toHaveBeenCalledWith('/error/401');
  });

  it('restaurarSesion() ignora datos corruptos sin lanzar error', () => {
    configurar();
    sessionStorage.setItem('mis.sesion', '{ esto no es json');

    expect(() => service.restaurarSesion()).not.toThrow();
    expect(shell.usuarioActivo()).toBeNull();
    expect(sessionStorage.getItem('mis.sesion')).toBeNull();
  });

  it('cerrarSesion() cierra la sesión de Google, limpia el token, el estado y sessionStorage', async () => {
    configurar({
      hasValidIdToken: vi.fn().mockReturnValue(true),
      getIdentityClaims: vi.fn().mockReturnValue({ email: 'ana.torres@confianza.pe' }),
    });
    await service.completarLoginGoogle();

    service.cerrarSesion(false);

    expect(oauthServiceFalso.logOut).toHaveBeenCalled();
    expect(service.token()).toBeNull();
    expect(shell.usuarioActivo()).toBeNull();
    expect(sessionStorage.getItem('mis.sesion')).toBeNull();
  });

  it('cerrarSesion() cancela el temporizador de expiración pendiente (no debe redirigir a 401 después)', async () => {
    vi.useFakeTimers();
    configurar({
      hasValidIdToken: vi.fn().mockReturnValue(true),
      getIdentityClaims: vi.fn().mockReturnValue({ email: 'ana.torres@confianza.pe' }),
    });
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await service.completarLoginGoogle();

    service.cerrarSesion(false);
    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(navSpy).not.toHaveBeenCalledWith('/error/401');
  });

  describe('Cambiar usuario (alternates)', () => {
    async function iniciarSesion() {
      configurar({
        hasValidIdToken: vi.fn().mockReturnValue(true),
        getIdentityClaims: vi.fn().mockReturnValue({ email: 'ana.torres@confianza.pe', name: 'Ana Torres' }),
      });
      await service.completarLoginGoogle();
    }

    it('completarLoginGoogle() expone los alternates recibidos del backend', async () => {
      await iniciarSesion();

      expect(service.alternates()).toEqual([
        { email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz', cargo: 'Supervisor' },
      ]);
      expect(service.esUsuarioAlterno()).toBe(false);
      expect(service.puedeCambiarUsuario()).toBe(true);
    });

    it('puedeCambiarUsuario() es falso cuando el usuario no tiene alternates asignados', async () => {
      configurar({
        hasValidIdToken: vi.fn().mockReturnValue(true),
        getIdentityClaims: vi.fn().mockReturnValue({ email: 'ana.torres@confianza.pe' }),
      });
      modSysLoginService.login.mockReturnValue(
        of({
          code: '0',
          headers: {},
          body: {
            login_response: {
              profile: { email: environment.devUser, nombre: 'Ana Torres', cod_bt: 'BT-001', tip_use: 0 },
              sid: 'winder-sid-1',
            },
          },
        })
      );

      await service.completarLoginGoogle();

      expect(service.alternates()).toEqual([]);
      expect(service.puedeCambiarUsuario()).toBe(false);
    });

    it('cambiarAUsuarioAlterno() cambia el usuario mostrado sin tocar el token de sesión', async () => {
      await iniciarSesion();
      const tokenAntes = service.token();

      await service.cambiarAUsuarioAlterno({ email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz' });

      expect(modSysLoginService.altLogin).toHaveBeenCalledWith('carlos.ruiz@confianza.pe');
      expect(shell.usuarioActivo()?.email).toBe('carlos.ruiz@confianza.pe');
      expect(shell.usuarioActivo()?.codBt).toBe('BT-002');
      expect(service.token()).toBe(tokenAntes);
      expect(service.esUsuarioAlterno()).toBe(true);
      expect(service.puedeCambiarUsuario()).toBe(false);

      const persistida = JSON.parse(sessionStorage.getItem('mis.sesion')!);
      expect(persistida.usuario.email).toBe('carlos.ruiz@confianza.pe');
      expect(persistida.usuarioOriginal.email).toBe(environment.devUser);
    });

    it('cambiarAUsuarioAlterno() preserva expiraEn — no reinicia el cronómetro de la sesión', async () => {
      await iniciarSesion();
      const expiraEnAntes = JSON.parse(sessionStorage.getItem('mis.sesion')!).expiraEn;

      await service.cambiarAUsuarioAlterno({ email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz' });

      const expiraEnDespues = JSON.parse(sessionStorage.getItem('mis.sesion')!).expiraEn;
      expect(expiraEnDespues).toBe(expiraEnAntes);
    });

    it('volverAUsuarioOriginal() restaura la identidad original sin llamar al backend de nuevo', async () => {
      await iniciarSesion();
      await service.cambiarAUsuarioAlterno({ email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz' });
      modSysLoginService.login.mockClear();
      modSysLoginService.altLogin.mockClear();

      service.volverAUsuarioOriginal();

      expect(modSysLoginService.login).not.toHaveBeenCalled();
      expect(modSysLoginService.altLogin).not.toHaveBeenCalled();
      expect(shell.usuarioActivo()?.email).toBe(environment.devUser);
      expect(service.esUsuarioAlterno()).toBe(false);
      expect(service.puedeCambiarUsuario()).toBe(true);

      const persistida = JSON.parse(sessionStorage.getItem('mis.sesion')!);
      expect(persistida.usuarioOriginal).toBeUndefined();
    });

    it('cambiarAUsuarioAlterno() traduce un error del backend Ant en un mensaje legible', async () => {
      await iniciarSesion();
      modSysLoginService.altLogin.mockReturnValue(throwError(() => new Error('Usuario alterno no autorizado')));

      await expect(
        service.cambiarAUsuarioAlterno({ email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz' })
      ).rejects.toThrow('Usuario alterno no autorizado');
      expect(shell.usuarioActivo()?.email).toBe(environment.devUser);
      expect(service.esUsuarioAlterno()).toBe(false);
    });

    it('cerrarSesion() limpia también los alternates y la identidad original', async () => {
      await iniciarSesion();
      await service.cambiarAUsuarioAlterno({ email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz' });

      service.cerrarSesion(false);

      expect(service.alternates()).toEqual([]);
      expect(service.esUsuarioAlterno()).toBe(false);
    });
  });
});

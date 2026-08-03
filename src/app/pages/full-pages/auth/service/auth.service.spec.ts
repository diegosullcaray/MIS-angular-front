import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
    id: 'u-1',
    name: 'Ana Torres',
    role: 'admin-sistema',
    systems: ['subsistema-reportes'],
    session_id: 'winder-sid-1',
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
  let modSysLoginService: { login: ReturnType<typeof vi.fn> };
  let oauthServiceFalso: ReturnType<typeof crearOAuthServiceFalso>;

  function configurar(oauthOverrides: Partial<Record<keyof OAuthService, unknown>> = {}) {
    modSysLoginService = { login: vi.fn().mockReturnValue(of(RESPUESTA_LOGIN)) };
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
  }

  beforeEach(() => {
    sessionStorage.clear();
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

    expect(usuario?.id).toBe('u-1');
    expect(usuario?.email).toBe(environment.devUser);
    expect(shell.usuarioActivo()?.id).toBe('u-1');
    expect(service.token()).toBe('winder-sid-1');
    expect(sessionStorage.getItem('mis.sesion')).toContain('winder-sid-1');
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
});

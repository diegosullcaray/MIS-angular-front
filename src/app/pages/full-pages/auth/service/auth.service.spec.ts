import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService, LoginResponse, MfaChallengeResponse } from './auth.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { Usuario } from '../../../modules/admin/models/acceso.model';

const USUARIO: Usuario = {
  id: 'u-1',
  nombre: 'Ana Torres',
  email: 'ana.torres@confianza.pe',
  rol: 'admin-sistema',
  subsistemas: ['subsistema-reportes'],
  activo: true,
  creadoEn: '2026-01-01T00:00:00Z',
};

describe('AuthService', () => {
  let service: AuthService;
  let shell: ShellStateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    shell = TestBed.inject(ShellStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login() envía credenciales y devuelve el desafío MFA sin abrir sesión', async () => {
    const desafio: MfaChallengeResponse = { mfaRequerido: true, mfaToken: 'mfa-123', email: USUARIO.email };

    const promesa = service.login({ email: USUARIO.email, password: 'secreta' });
    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(desafio);

    const resultado = await promesa;

    expect(resultado).toEqual(desafio);
    expect(shell.usuarioActivo()).toBeNull();
  });

  it('login() traduce un error HTTP en un mensaje legible', async () => {
    const promesa = service.login({ email: USUARIO.email, password: 'mala' });
    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    await expect(promesa).rejects.toThrow('Credenciales inválidas');
  });

  it('verificarOtp() válido publica el usuario en ShellStateService y persiste la sesión', async () => {
    const loginPromesa = service.login({ email: USUARIO.email, password: 'secreta' });
    httpMock.expectOne('/api/v1/auth/login').flush({
      mfaRequerido: true, mfaToken: 'mfa-123', email: USUARIO.email,
    } as MfaChallengeResponse);
    await loginPromesa;

    const otpPromesa = service.verificarOtp('123456');
    const req = httpMock.expectOne('/api/v1/auth/verificar-otp');
    expect(req.request.body).toEqual({ mfaToken: 'mfa-123', otp: '123456' });
    req.flush({ token: 'jwt-abc', usuario: USUARIO } as LoginResponse);

    const usuarioActivo = await otpPromesa;

    expect(usuarioActivo.id).toBe(USUARIO.id);
    expect(shell.usuarioActivo()?.id).toBe(USUARIO.id);
    expect(service.token()).toBe('jwt-abc');
    expect(sessionStorage.getItem('mis.sesion')).toContain('jwt-abc');
  });

  it('restaurarSesion() recupera la sesión persistida en sessionStorage', () => {
    sessionStorage.setItem('mis.sesion', JSON.stringify({
      token: 'jwt-persistido',
      usuario: {
        id: USUARIO.id, nombre: USUARIO.nombre, email: USUARIO.email,
        rol: USUARIO.rol, subsistemas: USUARIO.subsistemas,
      },
    }));

    service.restaurarSesion();

    expect(service.token()).toBe('jwt-persistido');
    expect(shell.usuarioActivo()?.id).toBe(USUARIO.id);
  });

  it('restaurarSesion() ignora datos corruptos sin lanzar error', () => {
    sessionStorage.setItem('mis.sesion', '{ esto no es json');

    expect(() => service.restaurarSesion()).not.toThrow();
    expect(shell.usuarioActivo()).toBeNull();
    expect(sessionStorage.getItem('mis.sesion')).toBeNull();
  });

  it('cerrarSesion() limpia token, estado y sessionStorage', async () => {
    const otpPromesa = service.verificarOtp('123456');
    httpMock.expectOne('/api/v1/auth/verificar-otp').flush({ token: 'jwt-abc', usuario: USUARIO } as LoginResponse);
    await otpPromesa;

    service.cerrarSesion(false);

    expect(service.token()).toBeNull();
    expect(shell.usuarioActivo()).toBeNull();
    expect(sessionStorage.getItem('mis.sesion')).toBeNull();
  });
});

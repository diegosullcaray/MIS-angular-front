import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpResponse, HttpEvent } from '@angular/common/http';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../../pages/full-pages/auth/service/auth.service';
import { ShellStateService } from '../services/shell-state.service';
import { environment } from '../../../environments/environment';
import type { UsuarioActivo } from '../interfaces/shell-state.model';

describe('authInterceptor', () => {
  let authFalso: { token: ReturnType<typeof signal<string | null>>; cerrarSesion: ReturnType<typeof vi.fn> };
  let shell: ShellStateService;

  function usuario(): UsuarioActivo {
    return {
      id: 'u-1',
      nombre: 'Ana Torres',
      email: 'ana.torres@confianza.pe',
      rol: 'admin-sistema',
      subsistemas: [],
    };
  }

  beforeEach(() => {
    authFalso = { token: signal<string | null>(null), cerrarSesion: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authFalso }],
    });
    shell = TestBed.inject(ShellStateService);
  });

  function ejecutar(url: string, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const req = new HttpRequest('GET', url);
    return TestBed.runInInjectionContext(() => authInterceptor(req, next));
  }

  it('no adjunta Authorization a las peticiones del backend Ant', async () => {
    authFalso.token.set('un-token');
    shell.setUsuarioActivo(usuario());

    let reqRecibido!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (req) => {
      reqRecibido = req;
      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(ejecutar(`${environment.requestConfigRootURL}/v1/g?w=abc`, next));

    expect(reqRecibido.headers.has('Authorization')).toBe(false);
  });

  it('no adjunta Authorization a las peticiones del discovery document de Google', async () => {
    authFalso.token.set('un-token');
    shell.setUsuarioActivo(usuario());

    let reqRecibido!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (req) => {
      reqRecibido = req;
      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(ejecutar('https://accounts.google.com/.well-known/openid-configuration', next));

    expect(reqRecibido.headers.has('Authorization')).toBe(false);
  });

  it('adjunta Authorization y X-User-Role en rutas del Host cuando hay token y usuario', async () => {
    authFalso.token.set('mi-token');
    shell.setUsuarioActivo(usuario());

    let reqRecibido!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (req) => {
      reqRecibido = req;
      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(ejecutar('/api/v1/algo', next));

    expect(reqRecibido.headers.get('Authorization')).toBe('Bearer mi-token');
    expect(reqRecibido.headers.get('X-User-Role')).toBe('admin-sistema');
  });

  it('no adjunta Authorization en rutas de login aunque haya token', async () => {
    authFalso.token.set('mi-token');
    shell.setUsuarioActivo(usuario());

    let reqRecibido!: HttpRequest<unknown>;
    const next: HttpHandlerFn = (req) => {
      reqRecibido = req;
      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(ejecutar('/auth/login', next));

    expect(reqRecibido.headers.has('Authorization')).toBe(false);
  });

  it('cierra la sesión en un 401 fuera de rutas de login', async () => {
    shell.setUsuarioActivo(usuario());
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(firstValueFrom(ejecutar('/api/v1/algo', next))).rejects.toBe(error);
    expect(authFalso.cerrarSesion).toHaveBeenCalled();
  });

  it('no cierra la sesión en un 401 de una ruta de login', async () => {
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(firstValueFrom(ejecutar('/auth/login', next))).rejects.toBe(error);
    expect(authFalso.cerrarSesion).not.toHaveBeenCalled();
  });

  it('no cierra la sesión en errores distintos de 401', async () => {
    shell.setUsuarioActivo(usuario());
    const error = new HttpErrorResponse({ status: 500 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(firstValueFrom(ejecutar('/api/v1/algo', next))).rejects.toBe(error);
    expect(authFalso.cerrarSesion).not.toHaveBeenCalled();
  });
});

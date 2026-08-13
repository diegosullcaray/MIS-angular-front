import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { httpErrorInterceptor } from './http-error.interceptor';
import { HttpErrorService } from '../../pages/full-pages/error/services/http-error.service';

describe('httpErrorInterceptor', () => {
  let httpError: HttpErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    httpError = TestBed.inject(HttpErrorService);
  });

  function ejecutar(url: string, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const req = new HttpRequest('GET', url);
    return TestBed.runInInjectionContext(() => httpErrorInterceptor(req, next));
  }

  it('deja pasar la petición sin intervenir cuando no hay error', async () => {
    const next: HttpHandlerFn = () => of({} as HttpEvent<unknown>);

    await expect(firstValueFrom(ejecutar('/api/v1/algo', next))).resolves.toBeDefined();
  });

  it('no intercepta rutas ignoradas (/auth/) aunque fallen', async () => {
    const irSpy = vi.spyOn(httpError, 'irAPaginaDeError');
    const error = new HttpErrorResponse({ status: 500 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(firstValueFrom(ejecutar('/auth/login', next))).rejects.toBe(error);
    expect(irSpy).not.toHaveBeenCalled();
  });

  it('redirige a la página de error cuando el status resuelto es fatal (ej. 500)', async () => {
    const irSpy = vi.spyOn(httpError, 'irAPaginaDeError').mockResolvedValue();
    const error = new HttpErrorResponse({ status: 500 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(firstValueFrom(ejecutar('/api/v1/algo', next))).rejects.toBe(error);
    expect(irSpy).toHaveBeenCalledWith(500);
  });

  it('no redirige cuando el status resuelto no es fatal (ej. 403)', async () => {
    const irSpy = vi.spyOn(httpError, 'irAPaginaDeError');
    const error = new HttpErrorResponse({ status: 403 });
    const next: HttpHandlerFn = () => throwError(() => error);

    await expect(firstValueFrom(ejecutar('/api/v1/algo', next))).rejects.toBe(error);
    expect(irSpy).not.toHaveBeenCalled();
  });
});

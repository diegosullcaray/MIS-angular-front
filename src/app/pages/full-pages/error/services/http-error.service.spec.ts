import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorService } from './http-error.service';
import { HTTP_ERROR_MESSAGES, HTTP_ERROR_FALLBACK } from '../constants/http-error.constants';

describe('HttpErrorService', () => {
  let service: HttpErrorService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(HttpErrorService);
    router = TestBed.inject(Router);
  });

  it('resolver() devuelve el HttpErrorInfo mapeado para un status conocido', () => {
    expect(service.resolver(404)).toEqual(HTTP_ERROR_MESSAGES[404]);
    expect(service.resolver(401)).toEqual(HTTP_ERROR_MESSAGES[401]);
  });

  it('resolver() cae al fallback (con el code real) para un status no mapeado', () => {
    expect(service.resolver(418)).toEqual({ ...HTTP_ERROR_FALLBACK, code: 418 });
  });

  it('statusDe() extrae el status de un HttpErrorResponse', () => {
    const error = new HttpErrorResponse({ status: 403 });
    expect(service.statusDe(error)).toBe(403);
  });

  it('statusDe() devuelve 0 para errores que no son HttpErrorResponse (sin red/CORS)', () => {
    expect(service.statusDe(new Error('network error'))).toBe(0);
    expect(service.statusDe('algo raro')).toBe(0);
  });

  it('irAPaginaDeError() navega a /error/:code con el status resuelto', async () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await service.irAPaginaDeError(500);

    expect(spy).toHaveBeenCalledWith(['/error', 500]);
  });
});

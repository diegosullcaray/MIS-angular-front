import { HttpErrorResponse } from '@angular/common/http';
import { esBloqueVacio } from './error-bloque.util';

describe('esBloqueVacio', () => {
  it('solo absorbe respuestas HTTP del servidor que caracterizan un bloque vacío', () => {
    expect(esBloqueVacio(new HttpErrorResponse({ status: 500 }))).toBe(true);
    expect(esBloqueVacio(new HttpErrorResponse({ status: 404 }))).toBe(true);
  });

  it('no disfraza un fallo de red ni valores ajenos como vacío', () => {
    expect(esBloqueVacio(new HttpErrorResponse({ status: 0 }))).toBe(false);
    expect(esBloqueVacio(new Error('sin red'))).toBe(false);
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActividadComercialService } from './actividad-comercial.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { COD_ACTIVIDAD_COMERCIAL } from '../constantes/actividad-comercial.constantes';

/**
 * El servicio usa `inject()` en un campo, así que necesita contexto de
 * inyección: se arma con TestBed y se dobla el borde Ant. Es el mismo patrón
 * que el resto de los specs de servicio del repo.
 */
function crear(respuesta: unknown, falla = false) {
  const getRegularTableResult = vi.fn(() =>
    falla ? throwError(() => new Error('backend caído')) : of(respuesta)
  );

  TestBed.configureTestingModule({
    providers: [{ provide: ModReportesService, useValue: { getRegularTableResult } }],
  });

  return { service: TestBed.inject(ActividadComercialService), getRegularTableResult };
}

describe('ActividadComercialService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  const filaOk = { cod: 'C-01', des: 'Prueba', mto: 100, est: 'ACTIVO' };

  it('arranca sin datos, sin carga y sin error', () => {
    const { service } = crear({ body: null });

    expect(service.filas()).toEqual([]);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('publica las filas y apaga la carga cuando el backend responde', () => {
    const { service } = crear({ body: { resultado: { data: [filaOk] } } });

    service.consultar();

    expect(service.filas()).toHaveLength(1);
    expect(service.totalMonto()).toBe(100);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('distingue respuesta vacía de error', () => {
    const { service } = crear({ body: { resultado: { data: [] } } });

    service.consultar();

    expect(service.vacio()).toBe(true);
    expect(service.error()).toBeNull();
  });

  it('publica el error sin disfrazarlo de tabla vacía', () => {
    const { service } = crear(null, true);

    service.consultar();

    expect(service.error()).toBeTruthy();
    expect(service.vacio()).toBe(false);
    expect(service.cargando()).toBe(false);
  });

  it('consulta el cod_rep declarado en constantes', () => {
    const { service, getRegularTableResult } = crear({ body: { resultado: { data: [] } } });

    service.consultar({ nom: 'x' });

    expect(getRegularTableResult).toHaveBeenCalledWith(COD_ACTIVIDAD_COMERCIAL, { nom: 'x' });
  });
});

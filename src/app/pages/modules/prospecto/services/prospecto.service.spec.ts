import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProspectoService } from './prospecto.service';
import { ActividadesService } from '../../actividades/services/actividades.service';

function crear(respuesta: unknown, falla = false) {
  const getRegResultadosListProsp = vi.fn(() =>
    falla ? throwError(() => new Error('backend caído')) : of(respuesta)
  );

  TestBed.configureTestingModule({
    providers: [{ provide: ActividadesService, useValue: { getRegResultadosListProsp } }],
  });

  return { service: TestBed.inject(ProspectoService), getRegResultadosListProsp };
}

describe('ProspectoService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  const filaOk = {
    HFECPRO: '2023-01-01',
    HAPENOMB: 'Juan Perez',
    HNUMDOC: '12345678',
    HNOMCOM: 'Comercial 1',
    HESTDCORE: 'ACTIVO',
    HFECESTA: '2023-01-02',
    HCANACAP: 'Canal A',
    HDESTER: 'Norte',
    HDESCOR: 'Corredor 1',
    HDESAGE: 'Agencia Centro',
  };

  it('arranca sin datos, sin carga y sin error', () => {
    const { service } = crear({ body: null });

    expect(service.filas()).toEqual([]);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('publica las filas y apaga la carga cuando el backend responde', () => {
    const { service } = crear({ body: { resultado: { result: [filaOk] } } });

    service.consultar();

    expect(service.filas()).toHaveLength(1);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('distingue respuesta vacía de error', () => {
    const { service } = crear({ body: { resultado: { result: [] } } });

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

  it('consulta usando el servicio de actividades', () => {
    const { service, getRegResultadosListProsp } = crear({ body: { resultado: { result: [] } } });

    service.consultar({ cod_bt: 'BT-001' });

    expect(getRegResultadosListProsp).toHaveBeenCalledWith('BT-001');
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BaseNegativaService } from './base-negativa.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';

describe('BaseNegativaService', () => {
  let service: BaseNegativaService;
  let getRegularTableResultSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getRegularTableResultSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularTableResult: getRegularTableResultSpy } }],
    });
    service = TestBed.inject(BaseNegativaService);
  });

  it('buscar() pide el SP RS_BASE_NEG_01 con el término bajo la clave "nom"', () => {
    getRegularTableResultSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { data: [] } } } as IWinderResponse));

    service.buscar('juan').subscribe();

    expect(getRegularTableResultSpy).toHaveBeenCalledWith('RS_BASE_NEG_01', { nom: 'juan' });
  });

  it('buscar() devuelve las filas de resultado.data', async () => {
    const filas = [{ HCTACLI: 'C-001', HDESCLI: 'Juan Pérez', FECHA: '2026-01-01', TIPO: 'Venta' }];
    getRegularTableResultSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { data: filas } } } as IWinderResponse));

    const resultado = await new Promise((resolve) => service.buscar('juan').subscribe(resolve));

    expect(resultado).toEqual(filas);
  });

  it('buscar() devuelve un arreglo vacío si el backend no trae resultado.data', async () => {
    getRegularTableResultSpy.mockReturnValue(of({ code: '0', headers: {}, body: {} } as IWinderResponse));

    const resultado = await new Promise((resolve) => service.buscar('juan').subscribe(resolve));

    expect(resultado).toEqual([]);
  });

  it('consultar() guarda las filas y parsea las columnas dinámicas de resultado.headers', () => {
    const columnas = [{ label: 'Cuenta', key: 'HCTACLI' }];
    getRegularTableResultSpy.mockReturnValue(
      of({ code: '0', headers: {}, body: { resultado: { data: [{ HCTACLI: 'C-001' }], headers: JSON.stringify(columnas) } } } as IWinderResponse)
    );

    service.consultar('C-001');

    expect(getRegularTableResultSpy).toHaveBeenCalledWith('RS_BASE_NEG_01', { nom: 'C-001' });
    expect(service.resultados()).toEqual([{ HCTACLI: 'C-001' }]);
    expect(service.headers()).toEqual(columnas);
    expect(service.cargando()).toBe(false);
  });

  it('consultar() deja las columnas vacías si el backend no trae resultado.headers', () => {
    getRegularTableResultSpy.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { data: [] } } } as IWinderResponse));

    service.consultar('C-001');

    expect(service.headers()).toEqual([]);
  });

  it('consultar() muestra un mensaje de error ante un fallo del backend', () => {
    getRegularTableResultSpy.mockReturnValue(throwError(() => new Error('backend caído')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    service.consultar('C-001');

    expect(service.error()).toBe('No se pudo cargar el resultado de la consulta.');
    expect(service.cargando()).toBe(false);
  });

  it('limpiar() resetea resultados, columnas, cargando y error', () => {
    getRegularTableResultSpy.mockReturnValue(
      of({ code: '0', headers: {}, body: { resultado: { data: [{ a: 1 }], headers: JSON.stringify([{ label: 'A', key: 'a' }]) } } } as IWinderResponse)
    );
    service.consultar('C-001');

    service.limpiar();

    expect(service.resultados()).toEqual([]);
    expect(service.headers()).toEqual([]);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
  });
});

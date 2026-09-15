import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ConsultaFenService } from './consulta-fen.service';

const FILA = {
  cod_ubi: '040101', des_dep: 'AREQUIPA', des_prov: 'AREQUIPA', des_dist: 'AREQUIPA',
  exp_mas: 'Muy Bajo', exp_inu: 'Medio', exp_seq: 'Medio', exp_pre: 'Alto',
};

describe('ConsultaFenService', () => {
  let servicio: ConsultaFenService;
  let consultar: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consultar = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularTableResult: consultar } }],
    });
    servicio = TestBed.inject(ConsultaFenService);
  });

  it('consulta el contrato legado por columna y selecciona el estado contenido', () => {
    consultar.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { data: [FILA] } } } as IWinderResponse));
    servicio.consultar(3, 'Arequipa');
    expect(consultar).toHaveBeenCalledWith('CON_AGRO_FEN', { col: 3, val: 'Arequipa' });
    expect(servicio.filas()).toEqual([FILA]);
    expect(servicio.error()).toBeNull();
    expect(servicio.vacio()).toBe(false);
  });

  it('distingue una respuesta vacía de un fallo de contrato', () => {
    consultar.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { data: [] } } } as IWinderResponse));
    servicio.consultar(0, '040101');
    expect(servicio.vacio()).toBe(true);

    consultar.mockReturnValue(of({ code: '0', headers: {}, body: { resultado: {} } } as IWinderResponse));
    servicio.consultar(0, '040101');
    expect(servicio.error()).toContain('formato inválido');
    expect(servicio.vacio()).toBe(false);
  });

  it('conserva el error de transporte como error', () => {
    consultar.mockReturnValue(throwError(() => new Error('sin red')));
    servicio.consultar(0, '040101');
    expect(servicio.error()).toContain('No se pudo realizar');
    expect(servicio.vacio()).toBe(false);
  });
});

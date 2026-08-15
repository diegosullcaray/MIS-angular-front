import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ResumenMovilidadService } from './resumen-movilidad.service';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../core/winder/winder/winder.interface';

describe('ResumenMovilidadService', () => {
  let service: ResumenMovilidadService;
  let reportesFalso: { getRegularData: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };
    reportesFalso = { getRegularData: vi.fn().mockReturnValue(of(respuesta)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: reportesFalso },
        { provide: AsesorSecService, useValue: { obtenerAsesores: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    service = TestBed.inject(ResumenMovilidadService);
  });

  it('obtenerResumenMovilidad() pide RESNMOV_02 (el id real es _02), vía getRegularData', () => {
    service.obtenerResumenMovilidad({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('RESNMOV_02', { tip_cod: 2, cod_rel: '12345678' });
  });
});

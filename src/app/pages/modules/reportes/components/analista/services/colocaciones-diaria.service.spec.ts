import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ColocacionesDiariaService } from './colocaciones-diaria.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('ColocacionesDiariaService', () => {
  let service: ColocacionesDiariaService;
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
    service = TestBed.inject(ColocacionesDiariaService);
  });

  it('obtenerColocacionesDiaria() pide los 3 bloques con cod_rep corto, vía getRegularData', () => {
    service.obtenerColocacionesDiaria({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    const params = { tip_cod: 2, cod_rel: '12345678' };
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('PROYEC_DIACOLREC_AS_01', params);
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('PROYEC_DIACOLREC_AS_02', params);
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('PROYEC_DIACOLREC_AS_03', params);
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AutonomiasService } from './autonomias.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';

describe('AutonomiasService', () => {
  let service: AutonomiasService;
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
    service = TestBed.inject(AutonomiasService);
  });

  it('obtenerAutonomias() pide LST_AUT_01 con los parámetros fijos c_aut/aut, vía getRegularData', () => {
    service.obtenerAutonomias({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('LST_AUT_01', {
      tip_cod: 2,
      cod_rel: '12345678',
      c_aut: 3,
      aut: 2,
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DesempenoSocialAnalistaService } from './desempeno-social-analista.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('DesempenoSocialAnalistaService', () => {
  let service: DesempenoSocialAnalistaService;
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
    service = TestBed.inject(DesempenoSocialAnalistaService);
  });

  it('obtenerDesempenoSocial() pide DESE_SOC_AS_01, vía getRegularData', () => {
    service.obtenerDesempenoSocial({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('DESE_SOC_AS_01', { tip_cod: 2, cod_rel: '12345678' });
  });
});

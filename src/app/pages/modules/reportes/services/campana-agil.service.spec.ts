import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CampanaAgilService } from './campana-agil.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';

describe('CampanaAgilService', () => {
  let service: CampanaAgilService;
  let reportesFalso: { getDeprecatedData: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };
    reportesFalso = { getDeprecatedData: vi.fn().mockReturnValue(of(respuesta)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: reportesFalso },
        { provide: AsesorSecService, useValue: { obtenerAsesores: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    service = TestBed.inject(CampanaAgilService);
  });

  it('obtenerCampanaAgil() pide el único bloque con la semana elegida como `sem`, vía getDeprecatedData', () => {
    service.obtenerCampanaAgil({ tip_cod: 2, cod_rel: '12345678' }, 3).subscribe();

    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/campania_agil/campana_agil_sec_01', {
      tip_cod: 2,
      cod_rel: '12345678',
      sem: 3,
    });
  });
});

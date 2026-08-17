import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CarteraService } from './cartera.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('CarteraService', () => {
  let service: CarteraService;
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
    service = TestBed.inject(CarteraService);
  });

  it('obtenerCartera() pide los 2 bloques por el path completo del legado (no un código corto), vía getDeprecatedData', () => {
    service.obtenerCartera({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/cartera/cartera_sec_01', {
      tip_cod: 2,
      cod_rel: '12345678',
    });
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/cartera/cartera_sec_02', {
      tip_cod: 2,
      cod_rel: '12345678',
    });
  });
});

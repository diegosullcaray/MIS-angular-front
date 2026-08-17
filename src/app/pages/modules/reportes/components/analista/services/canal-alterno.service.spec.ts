import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CanalAlternoService } from './canal-alterno.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('CanalAlternoService', () => {
  let service: CanalAlternoService;
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
    service = TestBed.inject(CanalAlternoService);
  });

  it('obtenerCanalAlterno() pide el único bloque por el path completo del legado, vía getDeprecatedData', () => {
    service.obtenerCanalAlterno({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/canal_alt/canal_alt_sec_01', {
      tip_cod: 2,
      cod_rel: '12345678',
    });
  });
});

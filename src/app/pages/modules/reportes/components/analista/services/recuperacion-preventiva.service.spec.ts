import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecuperacionPreventivaService } from './recuperacion-preventiva.service';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../core/winder/winder/winder.interface';

describe('RecuperacionPreventivaService', () => {
  let service: RecuperacionPreventivaService;
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
    service = TestBed.inject(RecuperacionPreventivaService);
  });

  it('obtenerRecuperacionPreventiva() pide el único bloque por el path completo del legado, vía getDeprecatedData', () => {
    service.obtenerRecuperacionPreventiva({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/recuperacion_preventiva/recuperacion_preventiva_01', {
      tip_cod: 2,
      cod_rel: '12345678',
    });
  });
});

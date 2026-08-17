import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AutonomiaTasasService } from './autonomia-tasas.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('AutonomiaTasasService', () => {
  let service: AutonomiaTasasService;
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
    service = TestBed.inject(AutonomiaTasasService);
  });

  it('obtenerAutonomiaTasas() pide los 4 bloques con su propio `var` fijo, vía getDeprecatedData', () => {
    service.obtenerAutonomiaTasas({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    const base = { tip_cod: 2, cod_rel: '12345678' };
    const modulo = 'rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec';
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith(`${modulo}_01`, { ...base, var: '4' });
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith(`${modulo}_02`, { ...base, var: '1' });
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith(`${modulo}_03`, { ...base, var: '3' });
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith(`${modulo}_04`, { ...base, var: '2' });
  });
});

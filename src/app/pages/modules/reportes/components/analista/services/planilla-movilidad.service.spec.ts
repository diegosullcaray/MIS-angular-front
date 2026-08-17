import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PlanillaMovilidadService } from './planilla-movilidad.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { fechaUltimoDia } from '../../../utils/fecha-reporte.util';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';
import type { ReportePlanillaMovilidad } from '../models/planilla-movilidad.model';

describe('PlanillaMovilidadService', () => {
  let service: PlanillaMovilidadService;
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
    service = TestBed.inject(PlanillaMovilidadService);
  });

  it('obtenerPlanillaMovilidad() pide los 4 bloques con el `fec` fijo (ayer), vía getRegularData', () => {
    service.obtenerPlanillaMovilidad({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    const params = { tip_cod: 2, cod_rel: '12345678', fec: fechaUltimoDia() };
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('PLANMOV_01', params);
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('PLANMOV_02', params);
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('PLANMOV_03', params);
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('PLANMOV_04', params);
  });

  it('si un bloque falla (ej. 500 del backend), resuelve ese bloque como tabla vacía en vez de tirar abajo los otros 3', () => {
    reportesFalso.getRegularData.mockImplementation((codRep: string) =>
      codRep === 'PLANMOV_03'
        ? throwError(() => new Error('Resultado vacio para: regularData'))
        : of({ code: '0', headers: {}, body: { result: { headers: [], body: [{ nom: 'a' }], additional: {} } } }),
    );

    let resultado: ReportePlanillaMovilidad | undefined;
    service.obtenerPlanillaMovilidad({ tip_cod: 2, cod_rel: '12345678' }).subscribe((r) => (resultado = r));

    expect(resultado?.tabla1.body).toEqual([{ nom: 'a' }]);
    expect(resultado?.tabla2.body).toEqual([{ nom: 'a' }]);
    expect(resultado?.tabla3).toEqual({ headers: [], body: [], additional: {} });
    expect(resultado?.tabla4.body).toEqual([{ nom: 'a' }]);
  });
});

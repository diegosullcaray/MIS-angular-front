import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MonitorEfectividadesService } from './monitor-efectividades.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO } from '../models/analista/monitor-efectividades.model';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';

describe('MonitorEfectividadesService', () => {
  let service: MonitorEfectividadesService;
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
    service = TestBed.inject(MonitorEfectividadesService);
  });

  it('obtenerMonitorEfectividades() pide RS_MON_EFEC_SEC_01 con los 6 filtros mezclados y `pagen: 1` fijo, vía getRegularData', () => {
    service.obtenerMonitorEfectividades({ tip_cod: 2, cod_rel: '12345678' }, FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO).subscribe();

    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('RS_MON_EFEC_SEC_01', {
      tip_cod: 2,
      cod_rel: '12345678',
      tramof: 'TODO',
      prod: 'TODO',
      comp_r: 'TODO',
      zcuo: 'TODO',
      ucuo: 'TODO',
      tdcr: 'TODO',
      pagen: 1,
    });
  });
});

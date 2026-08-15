import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MonitorMetasDesembolsoService } from './monitor-metas-desembolso.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';

function respuesta(additional: Record<string, unknown> = {}): IWinderResponse {
  return { code: '0', headers: {}, body: { result: { headers: [], body: [], additional } } };
}

describe('MonitorMetasDesembolsoService', () => {
  let service: MonitorMetasDesembolsoService;
  let reportesFalso: { getDeprecatedData: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    reportesFalso = {
      getDeprecatedData: vi.fn((codRep: string) => {
        if (codRep.endsWith('_01')) return of(respuesta({ fecha: '2026-08-14', hora: '10:00', cumpl_des_acum: '85%' }));
        if (codRep.endsWith('_02')) return of(respuesta({ cumpl_ope_acum: '90%' }));
        return of(respuesta());
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: reportesFalso },
        { provide: AsesorSecService, useValue: { obtenerAsesores: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    service = TestBed.inject(MonitorMetasDesembolsoService);
  });

  it('pide los 3 bloques por el path completo del legado, con tipmet:1 en _01 y _02', () => {
    service.obtenerMonitorMetasDesembolso({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    const base = { tip_cod: 2, cod_rel: '12345678' };
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_01', {
      ...base,
      tipmet: 1,
    });
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_02', {
      ...base,
      tipmet: 1,
    });
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith(
      'rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_03',
      base,
    );
  });

  it('arma las tarjetas KPI a partir del `additional` de los bloques _01/_02', () => {
    let resultado: unknown;
    service.obtenerMonitorMetasDesembolso({ tip_cod: 2, cod_rel: '12345678' }).subscribe((r) => (resultado = r));

    expect(resultado).toEqual(
      expect.objectContaining({
        kpiOperaciones: { fecha: '2026-08-14', hora: '10:00', cumpl_des_acum: '85%' },
        kpiMonto: { cumpl_ope_acum: '90%' },
      }),
    );
  });
});

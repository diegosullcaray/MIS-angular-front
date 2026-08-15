import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModReportesService } from './mod-reportes.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModReportesService', () => {
  let service: ModReportesService;
  let prepareSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: {} };
    const getSpy = vi.fn().mockReturnValue(of(respuesta));
    prepareSpy = vi.fn().mockReturnValue({ get: getSpy });

    TestBed.configureTestingModule({
      providers: [{ provide: WinderService, useValue: { prepare: prepareSpy } }],
    });
    service = TestBed.inject(ModReportesService);
  });

  it('usa el puerto/appId/secret del módulo "reporting"', () => {
    service.getRegularTableResult('RS_BASE_NEG_01', { nom: 'juan' }).subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 5304, secret: environment.moduleSecrets.reporting, appId: 'reporting' });
  });

  it('getRegularTableResult() envía cod_rep junto con los parámetros propios del reporte', () => {
    service.getRegularTableResult('RS_BASE_NEG_01', { nom: 'juan', otro: 1 }).subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('table.regular');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ nom: 'juan', otro: 1, cod_rep: 'RS_BASE_NEG_01' });
  });

  it('getRegularData() usa el strand "regularData" con respuesta "result"', () => {
    service.getRegularData('Monitor_Dese_01', { tip_cod: 1, cod_rel: 'BT-001', tipmet: 1 }).subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('regularData');
    expect(strand.name).toBe('result');
    expect(strand.payload).toEqual({ tip_cod: 1, cod_rel: 'BT-001', tipmet: 1, cod_rep: 'Monitor_Dese_01' });
  });

  it('getDeprecatedData() usa el strand "reportData" (no "regularData") con respuesta "result"', () => {
    // Reportes que el propio legado marca como no migrados a regularData (ej. "Cartera").
    service.getDeprecatedData('rda/sectorista/cartera/cartera_sec_01', { tip_cod: 2, cod_rel: '12345678' }).subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('reportData');
    expect(strand.name).toBe('result');
    expect(strand.payload).toEqual({ tip_cod: 2, cod_rel: '12345678', cod_rep: 'rda/sectorista/cartera/cartera_sec_01' });
  });

  it('getGraphicData() usa el strand "graphicData" con respuesta "result"', () => {
    service.getGraphicData('rda/sectorista/brecha/brecha_inversion_sec_01', { tip_cod: 2, cod_rel: '12345678' }).subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('graphicData');
    expect(strand.name).toBe('result');
    expect(strand.payload).toEqual({ tip_cod: 2, cod_rel: '12345678', cod_rep: 'rda/sectorista/brecha/brecha_inversion_sec_01' });
  });
});

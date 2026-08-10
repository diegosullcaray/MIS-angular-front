import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModDashboardService } from './mod-dashboard.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModDashboardService', () => {
  let service: ModDashboardService;
  let prepareSpy: ReturnType<typeof vi.fn>;
  let postSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: {} };
    const getSpy = vi.fn().mockReturnValue(of(respuesta));
    postSpy = vi.fn().mockReturnValue(of({}));
    prepareSpy = vi.fn().mockReturnValue({ get: getSpy, post: postSpy });

    TestBed.configureTestingModule({
      providers: [{ provide: WinderService, useValue: { prepare: prepareSpy } }],
    });
    service = TestBed.inject(ModDashboardService);
  });

  it('usa el puerto/appId/secret del módulo "app" (igual que Presupuesto/ESG)', () => {
    service.getObjectList('BT-001', 0).subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 6302, secret: environment.moduleSecrets.app, appId: 'app' });
  });

  it('getObjectList() pide reportes2.lista con cod_bt/is_admin y responseName "resultado"', () => {
    service.getObjectList('BT-001', 1).subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('reportes2.lista');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001', is_admin: 1 });
  });

  it('getPowerBIReportToken() pide reportes2.pbi_rtoken con report_id/dataset_id', () => {
    service.getPowerBIReportToken('rep-1', 'ds-1').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('reportes2.pbi_rtoken');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ report_id: 'rep-1', dataset_id: 'ds-1' });
  });

  it('getObjectUsers() pide reportes2.usuarios con report_id', () => {
    service.getObjectUsers('rep-1').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('reportes2.usuarios');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ report_id: 'rep-1' });
  });

  it('postObjectUsers() hace POST a reportes2.guardar con el json serializado', () => {
    service.postObjectUsers([{ id: 'rep-1', val: 'a@b.pe' }]).subscribe();

    expect(postSpy).toHaveBeenCalled();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('reportes2.guardar');
    expect(strand.payload).toEqual({ json: JSON.stringify([{ id: 'rep-1', val: 'a@b.pe' }]) });
  });
});

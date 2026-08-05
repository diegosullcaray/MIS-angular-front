import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModSysAdminService } from './mod-sys-admin.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModSysAdminService', () => {
  let service: ModSysAdminService;
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
    service = TestBed.inject(ModSysAdminService);
  });

  it('usa el puerto/appId/secret del módulo "admin"', () => {
    service.getMenuItems('ana.torres@confianza.pe').subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 6301, secret: environment.moduleSecrets.admin, appId: 'admin' });
  });

  it('getMenuItems() pide list_sec con el email dado y responseName "menu_response"', () => {
    service.getMenuItems('ana.torres@confianza.pe').subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('list_sec');
    expect(strand.name).toBe('menu_response');
    expect(strand.payload).toEqual({ email: 'ana.torres@confianza.pe' });
  });

  it('getBaseHierarchy() pide base_hier con email y cod_jer', () => {
    service.getBaseHierarchy('ana.torres@confianza.pe', 9).subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('base_hier');
    expect(strand.name).toBe('base_hierarchy');
    expect(strand.payload).toEqual({ email: 'ana.torres@confianza.pe', cod_jer: 9 });
  });

  it('getLevelHierarchy() serializa cod_rels como cadena separada por comas', () => {
    service.getLevelHierarchy(9, 2, 4, ['A1', 'B2', 'C3']).subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('level_hier');
    expect(strand.name).toBe('level_hierarchy');
    expect(strand.payload).toEqual({ cod_jer: 9, lvl_jer: 2, tip_cod: 4, cod_rels: 'A1,B2,C3' });
  });

  it('getLevelHierarchy() serializa params adicionales como JSON cuando se pasan', () => {
    service.getLevelHierarchy(9, 2, 4, ['A1'], { key: 'fec', val: '2026-01-01' }).subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.payload['params']).toBe(JSON.stringify({ key: 'fec', val: '2026-01-01' }));
  });

  it('getListPick01() pide list_pick_01 con tip_cod y cod_rel', () => {
    service.getListPick01(4, 'REL-1').subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('list_pick_01');
    expect(strand.name).toBe('list_res');
    expect(strand.payload).toEqual({ tip_cod: 4, cod_rel: 'REL-1' });
  });

  it('postRouteTrack() hace un POST a reg_track_info con el JSON de tracking', () => {
    service.postRouteTrack('{"ruta":"/app/ranking-k"}').subscribe();

    expect(postSpy).toHaveBeenCalled();
    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('reg_track_info');
    expect(strand.payload).toEqual({ reg_json: '{"ruta":"/app/ranking-k"}' });
  });
});

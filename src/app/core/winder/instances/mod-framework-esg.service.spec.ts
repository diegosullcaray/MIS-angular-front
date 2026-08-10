import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModFrameworkEsgService } from './mod-framework-esg.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModFrameworkEsgService', () => {
  let service: ModFrameworkEsgService;
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
    service = TestBed.inject(ModFrameworkEsgService);
  });

  it('usa el puerto/appId/secret del módulo "app" (igual que Presupuesto/Kaypacha)', () => {
    service.getResumenPor().subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 6302, secret: environment.moduleSecrets.app, appId: 'app' });
  });

  it('getConfiguracionMod() pide esg.cfg_mod con cod_bt y responseName "resultado"', () => {
    service.getConfiguracionMod('BT-001').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('esg.cfg_mod');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001' });
  });

  it('getResumenPor() pide esg.res_por sin parámetros', () => {
    service.getResumenPor().subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('esg.res_por');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({});
  });

  it('getResumenCat() pide esg.res_cat con cod_cat/cod_bt/is_admin', () => {
    service.getResumenCat(2, 'BT-001', 1).subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('esg.res_cat');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ cod_cat: 2, cod_bt: 'BT-001', is_admin: 1 });
  });

  it('postActualizaMet() hace POST a esg.act_met con cod_met y cfg serializado', () => {
    service.postActualizaMet('BT-001', 15, { des_dis: 'Sí' }).subscribe();

    expect(postSpy).toHaveBeenCalled();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('esg.act_met');
    expect(strand.payload).toEqual({
      cod_bt: 'BT-001',
      cod_met: 15,
      cfg: JSON.stringify({ des_dis: 'Sí' }),
    });
  });

  it('getMetUsers() pide esg.get_users con cod_met', () => {
    service.getMetUsers('15').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('esg.get_users');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ cod_met: '15' });
  });

  it('postMetUsers() hace POST a esg.post_users con el json serializado', () => {
    service.postMetUsers([{ id: '15', val: 'a@b.pe,c@d.pe' }]).subscribe();

    expect(postSpy).toHaveBeenCalled();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('esg.post_users');
    expect(strand.payload).toEqual({
      json: JSON.stringify([{ id: '15', val: 'a@b.pe,c@d.pe' }]),
    });
  });
});

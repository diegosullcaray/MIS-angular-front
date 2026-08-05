import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModPresupuestoService } from './mod-presupuesto.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModPresupuestoService', () => {
  let service: ModPresupuestoService;
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
    service = TestBed.inject(ModPresupuestoService);
  });

  it('usa el puerto/appId/secret del módulo "app" (igual que Kaypacha)', () => {
    service.getRegResultados(11).subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 6302, secret: environment.moduleSecrets.app, appId: 'app' });
  });

  it('getRegResultados() pide presupuesto.get_reg_res con tip_cod y responseName "resultado"', () => {
    service.getRegResultados(11).subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('presupuesto.get_reg_res');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ tip_cod: 11 });
  });

  it('postRegResultados() hace POST a presupuesto.post_reg_res con cod_bt y las filas serializadas', () => {
    service.postRegResultados('BT-001', [{ des_rel: 'Ag. 1', cod_res: 'a@b.pe' }]).subscribe();

    expect(postSpy).toHaveBeenCalled();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('presupuesto.post_reg_res');
    expect(strand.payload).toEqual({
      cod_bt: 'BT-001',
      ov_json: JSON.stringify([{ des_rel: 'Ag. 1', cod_res: 'a@b.pe' }]),
    });
  });

  it('getLogVerificaciones() pide presupuesto.get_log_ver con tip_cod y cod_sec', () => {
    service.getLogVerificaciones(7, 'SEC-1').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('presupuesto.get_log_ver');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ tip_cod: 7, cod_sec: 'SEC-1' });
  });

  it('postLogVerificaciones() hace POST a presupuesto.post_log_ver con cod_bt/tip_cod/cod_rel/cod_sec', () => {
    service.postLogVerificaciones('BT-001', 7, 'REL-1', 'SEC-1').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('presupuesto.post_log_ver');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001', tip_cod: 7, cod_rel: 'REL-1', cod_sec: 'SEC-1' });
  });

  it('getResCarCreditos() pide presupuesto.get_car_cre con email/tip_cod/cod_rel y responseName "resumen"', () => {
    service.getResCarCreditos('ana@confianza.pe', 9, 'REL-1').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('presupuesto.get_car_cre');
    expect(strand.name).toBe('resumen');
    expect(strand.payload).toEqual({ email: 'ana@confianza.pe', tip_cod: 9, cod_rel: 'REL-1' });
  });

  it('postResCarCreditos() hace POST a presupuesto.post_car_cre con las filas serializadas', () => {
    service.postResCarCreditos('BT-001', 9, 'REL-1', [{ ord: 1 }]).subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('presupuesto.post_car_cre');
    expect(strand.payload).toEqual({
      cod_bt: 'BT-001', tip_cod: 9, cod_rel: 'REL-1', ov_json: JSON.stringify([{ ord: 1 }]),
    });
  });

  it('getResDepRed()/postResDepRed() usan las rutas presupuesto.get_dep_red/post_dep_red', () => {
    service.getResDepRed('ana@confianza.pe', 2, 'REL-1').subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand).actionRoute).toBe('presupuesto.get_dep_red');

    service.postResDepRed('BT-001', 2, 'REL-1', [{ ord: 1 }]).subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[1][1].strands as Strand).actionRoute).toBe('presupuesto.post_dep_red');
  });

  it('getResDepBP()/postResDepBP() usan las rutas presupuesto.get_dep_bp/post_dep_bp', () => {
    service.getResDepBP('ana@confianza.pe', 7, 'REL-1').subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand).actionRoute).toBe('presupuesto.get_dep_bp');

    service.postResDepBP('BT-001', 7, 'REL-1', [{ ord: 1 }]).subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[1][1].strands as Strand).actionRoute).toBe('presupuesto.post_dep_bp');
  });

  it('getResSegComercial()/postResSegComercial() usan las rutas presupuesto.get_seg_com/post_seg_com', () => {
    service.getResSegComercial('ana@confianza.pe', 9, 'REL-1').subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand).actionRoute).toBe('presupuesto.get_seg_com');

    service.postResSegComercial('BT-001', 9, 'REL-1', [{ ord: 1 }]).subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[1][1].strands as Strand).actionRoute).toBe('presupuesto.post_seg_com');
  });

  it('getResSegOperaciones()/postResSegOperaciones() usan las rutas presupuesto.get_seg_ope/post_seg_ope', () => {
    service.getResSegOperaciones('ana@confianza.pe', 2, 'REL-1').subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand).actionRoute).toBe('presupuesto.get_seg_ope');

    service.postResSegOperaciones('BT-001', 2, 'REL-1', [{ ord: 1 }]).subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[1][1].strands as Strand).actionRoute).toBe('presupuesto.post_seg_ope');
  });
});

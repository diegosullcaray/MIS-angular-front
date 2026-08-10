import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModIncentivosService } from './mod-incentivos.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModIncentivosService', () => {
  let service: ModIncentivosService;
  let prepareSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: {} };
    const getSpy = vi.fn().mockReturnValue(of(respuesta));
    prepareSpy = vi.fn().mockReturnValue({ get: getSpy, post: vi.fn().mockReturnValue(of({})) });

    TestBed.configureTestingModule({
      providers: [{ provide: WinderService, useValue: { prepare: prepareSpy } }],
    });
    service = TestBed.inject(ModIncentivosService);
  });

  it('usa el puerto/appId/secret del módulo "app" (igual que Presupuesto/ESG/Dashboard)', () => {
    service.getFromHierList(18, '231', 19).subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 6302, secret: environment.moduleSecrets.app, appId: 'app' });
  });

  it('getFromHierList() pide incentivos3.lista3 con tip_cod/cod_rel/tip_cod_l', () => {
    service.getFromHierList(18, '231', 19).subscribe();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('incentivos3.lista3');
    expect(strand.payload).toEqual({ tip_cod: 18, cod_rel: '231', tip_cod_l: 19 });
  });

  it('getDataSourcesIndividual() pide incentivos4.resultados4 con model/tip_cod/cod_rel/fec', () => {
    service.getDataSourcesIndividual('2026', 1, 'BT-001', '20260101').subscribe();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('incentivos4.resultados4');
    expect(strand.payload).toEqual({ model: '2026', tip_cod: 1, cod_rel: 'BT-001', fec: '20260101' });
  });

  it('getDataSourcesGrupal() pide incentivos4.resultados5 sin "model"', () => {
    service.getDataSourcesGrupal(1, 'BT-001', '20260101').subscribe();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('incentivos4.resultados5');
    expect(strand.payload).toEqual({ tip_cod: 1, cod_rel: 'BT-001', fec: '20260101' });
  });

  it('calcularIndividual() pide incentivos4.calculadora4 con los params serializados', () => {
    service.calcularIndividual('2026', { v_car: 10 }, '20260101').subscribe();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('incentivos4.calculadora4');
    expect(strand.payload).toEqual({ model: '2026', params: JSON.stringify({ v_car: 10 }), fec: '20260101' });
  });

  it('calcularGrupal() pide incentivos4.calculadora5 sin "model"', () => {
    service.calcularGrupal({ v_car: 10 }, '20260101').subscribe();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('incentivos4.calculadora5');
    expect(strand.payload).toEqual({ params: JSON.stringify({ v_car: 10 }), fec: '20260101' });
  });

  it('getDetail() pide incentivos3.detalle_var3 con cod_var', () => {
    service.getDetail(1, 'BT-001', 91, '20260101').subscribe();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('incentivos3.detalle_var3');
    expect(strand.payload).toEqual({ tip_cod: 1, cod_rel: 'BT-001', cod_var: 91, fec: '20260101' });
  });

  it('getTasa()/getProd()/getCliBanc()/getRetencion() piden sus rutas respectivas sin cod_var', () => {
    service.getTasa(1, 'BT-001', '20260101').subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand).actionRoute).toBe('incentivos3.tasas3');

    service.getProd(1, 'BT-001', '20260101').subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[1][1].strands as Strand).actionRoute).toBe('incentivos3.productividad3');

    service.getCliBanc(1, 'BT-001', '20260101').subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[2][1].strands as Strand).actionRoute).toBe('incentivos3.bancarizados3');

    service.getRetencion(1, 'BT-001', '20260101').subscribe();
    expect(inspeccionar(prepareSpy.mock.calls[3][1].strands as Strand).actionRoute).toBe('incentivos4.retencion4');
  });
});

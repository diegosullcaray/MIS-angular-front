import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModSeccionesService } from './mod-secciones.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModSeccionesService', () => {
  let service: ModSeccionesService;
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
    service = TestBed.inject(ModSeccionesService);
  });

  it('usa el puerto/appId/secret del módulo "secciones"', () => {
    service.getDetalleCategorizacion('BT-001').subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 5301, secret: environment.moduleSecrets.secciones, appId: 'secciones' });
  });

  it('getDetalleCategorizacion() pide categorizacion.detalle con cod_bt y responseName "resultado"', () => {
    service.getDetalleCategorizacion('BT-001').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('categorizacion.detalle');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001' });
  });

  it('getResumenDashboard() pide dashboard.resumen con cod_bt', () => {
    service.getResumenDashboard('BT-001').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('dashboard.resumen');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001' });
  });

  it('getHistoricoVariable() pide dashboard.historico con cod_bt y cod_var', () => {
    service.getHistoricoVariable('BT-001', 'sal').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('dashboard.historico');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001', cod_var: 'sal' });
  });

  it('getDetalleCliente() pide dashboard.cliente con cod_bt/num_doc/tip_doc/pais', () => {
    service.getDetalleCliente('BT-001', '12345678', 1, 604).subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('dashboard.cliente');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001', num_doc: '12345678', tip_doc: 1, pais: 604 });
  });

  it('getListaPrioLeads() pide listas.prio_leads con cod_bt', () => {
    service.getListaPrioLeads('BT-001').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('listas.prio_leads');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001' });
  });

  it('getListaBecas() pide listas.pro_becas con cod_bt', () => {
    service.getListaBecas('BT-001').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('listas.pro_becas');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001' });
  });

  it('postProsBecas() hace POST a listas.post_becas con cod_bt/num_doc/com', () => {
    service.postProsBecas('BT-001', '12345678', 'Cliente interesado').subscribe();

    expect(postSpy).toHaveBeenCalled();
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('listas.post_becas');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001', num_doc: '12345678', com: 'Cliente interesado' });
  });

  it('getSecList() pide sec_list2 con email y responseName "result_sectorista"', () => {
    service.getSecList('asesor@confianza.pe').subscribe();

    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('sec_list2');
    expect(strand.name).toBe('result_sectorista');
    expect(strand.payload).toEqual({ email: 'asesor@confianza.pe' });
  });

  it('postRegularUpdate() pide regularUpdate por GET (no POST) con cod_rep y los params', () => {
    service.postRegularUpdate('UPD_CAPRET_01', { num_doc: '12345678', reaccion: { afecNeg: 'Total' } }).subscribe();

    expect(postSpy).not.toHaveBeenCalled(); // el legado manda esta acción por GET-encoded, no un POST real
    const strand = inspeccionar(prepareSpy.mock.calls[0][1].strands as Strand);
    expect(strand.actionRoute).toBe('regularUpdate');
    expect(strand.name).toBe('result');
    expect(strand.payload).toEqual({ num_doc: '12345678', reaccion: { afecNeg: 'Total' }, cod_rep: 'UPD_CAPRET_01' });
  });
});

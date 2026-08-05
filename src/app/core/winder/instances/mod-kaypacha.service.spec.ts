import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModKaypachaService } from './mod-kaypacha.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/** Strand con campos privados — se inspecciona vía JSON (igual que lo serializa WinderService). */
function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModKaypachaService', () => {
  let service: ModKaypachaService;
  let prepareSpy: ReturnType<typeof vi.fn>;
  let respuesta: IWinderResponse;

  beforeEach(() => {
    respuesta = { code: '0', headers: {}, body: {} };
    const getSpy = vi.fn().mockReturnValue(of(respuesta));
    prepareSpy = vi.fn().mockReturnValue({ get: getSpy });

    TestBed.configureTestingModule({
      providers: [{ provide: WinderService, useValue: { prepare: prepareSpy } }],
    });
    service = TestBed.inject(ModKaypachaService);
  });

  it('getListRanking() usa el puerto/appId/secret del módulo "app" y envía cod_bt en el payload', () => {
    service.getListRanking('BT-001').subscribe();

    const [conn, conf] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 6302, secret: environment.moduleSecrets.app, appId: 'app' });

    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('kaypacha.listRanking');
    expect(strand.name).toBe('resultado');
    expect(strand.payload).toEqual({ cod_bt: 'BT-001' });
  });

  it('getDetalleRanking() envía el rdestip bajo la clave cod_bt, igual que el legado', () => {
    service.getDetalleRanking('cat-01').subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('kaypacha.DetalleRanking');
    expect(strand.payload).toEqual({ cod_bt: 'cat-01' });
  });

  it('getColaboradoresData() pide kaypacha.colaboradoresData con el cod_bt dado', () => {
    service.getColaboradoresData('BT-002').subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('kaypacha.colaboradoresData');
    expect(strand.payload).toEqual({ cod_bt: 'BT-002' });
  });

  it('getUserLists() pide kaypacha.colaboradores sin parámetros', () => {
    service.getUserLists().subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('kaypacha.colaboradores');
    expect(strand.payload).toEqual({});
  });
});

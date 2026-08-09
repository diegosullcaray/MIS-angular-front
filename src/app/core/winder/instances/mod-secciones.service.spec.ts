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

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: {} };
    const getSpy = vi.fn().mockReturnValue(of(respuesta));
    prepareSpy = vi.fn().mockReturnValue({ get: getSpy, post: vi.fn() });

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
});

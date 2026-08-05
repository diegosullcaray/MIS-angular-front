import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModSysLoginService } from './mod-sys-login.service';
import { WinderService } from '../winder/winder.service';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

function inspeccionar(strand: Strand): { actionRoute: string; name: string; payload: Record<string, unknown> } {
  return JSON.parse(JSON.stringify(strand));
}

describe('ModSysLoginService', () => {
  let service: ModSysLoginService;
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
    service = TestBed.inject(ModSysLoginService);
  });

  it('usa el puerto/appId/secret del módulo "session"', () => {
    service.login('ana.torres@confianza.pe').subscribe();

    const [conn] = prepareSpy.mock.calls[0];
    expect(conn).toEqual({ port: 6300, secret: environment.moduleSecrets.session, appId: 'session' });
  });

  it('login() envía el email con alt=0', () => {
    service.login('ana.torres@confianza.pe').subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('login');
    expect(strand.name).toBe('login_response');
    expect(strand.payload).toEqual({ email: 'ana.torres@confianza.pe', alt: 0 });
  });

  it('altLogin() envía el mismo email con alt=1', () => {
    service.altLogin('ana.torres@confianza.pe').subscribe();

    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('login');
    expect(strand.payload).toEqual({ email: 'ana.torres@confianza.pe', alt: 1 });
  });

  it('postMeta() serializa el objeto meta como JSON dentro del payload', () => {
    service.postMeta('ana.torres@confianza.pe', { ip: '10.0.0.1', ua: 'Chrome' }).subscribe();

    expect(postSpy).toHaveBeenCalled();
    const conf = prepareSpy.mock.calls[0][1];
    const strand = inspeccionar(conf.strands as Strand);
    expect(strand.actionRoute).toBe('meta');
    expect(strand.payload).toEqual({
      email: 'ana.torres@confianza.pe',
      meta: JSON.stringify({ ip: '10.0.0.1', ua: 'Chrome' }),
    });
  });
});

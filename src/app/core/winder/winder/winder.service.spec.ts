import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WinderService } from './winder.service';
import { Strand } from './strand.class';
import { RESTService } from '../rest/rest.service';
import { RESTPacket } from '../rest/rest-packet.class';
import { CypherService } from '../../services/cypher.service';
import { environment } from '../../../../environments/environment';
import type { IWinderConnectionConf } from './winder.interface';

const CONN: IWinderConnectionConf = { port: 6300, secret: environment.moduleSecrets.session, appId: 'session' };

describe('WinderService', () => {
  let service: WinderService;
  let cypher: CypherService;
  let getSpy: ReturnType<typeof vi.fn>;
  let postSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSpy = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: {} }));
    postSpy = vi.fn().mockReturnValue(of({}));

    TestBed.configureTestingModule({
      providers: [{ provide: RESTService, useValue: { get: getSpy, post: postSpy } }],
    });
    service = TestBed.inject(WinderService);
    cypher = TestBed.inject(CypherService);
  });

  function packetDeGet(): RESTPacket {
    service.get().subscribe();
    return getSpy.mock.calls[0][0] as RESTPacket;
  }

  function configCifradaDe(packet: RESTPacket): Record<string, unknown> {
    const url = packet.computeURL();
    const cipher = new URL(url).searchParams.get('w')!;
    // El parámetro `w` se cifra con el secreto global (`environment.cypherSecret`,
    // el default de `CypherService.encrypt()`) — no con el secreto del módulo
    // (`CONN.secret`), que solo viaja como el campo `key` DENTRO del JSON cifrado
    // (ver `WinderService.winderConfig()`).
    const plano = cypher.decryptFromRoute(cipher, environment.cypherSecret);
    return JSON.parse(plano);
  }

  it('get() apunta a v1/g y cifra {key, port, id, responseType} en el parámetro w', () => {
    const strand = new Strand('login', 'login_response');
    strand.pushToPayload('email', 'ana.torres@confianza.pe');
    service.prepare(CONN, { responseType: 'JSON', strands: strand });

    const packet = packetDeGet();

    expect(packet.baseRoute).toBe('v1/g');
    const config = configCifradaDe(packet);
    expect(config).toEqual({ key: CONN.secret, port: CONN.port, id: CONN.appId, responseType: 'JSON' });
  });

  it('inyecta el header Winder-Params con el/los Strand(s) serializados (sin formData)', () => {
    const strand = new Strand('login', 'login_response');
    strand.pushToPayload('email', 'ana.torres@confianza.pe');
    service.prepare(CONN, { responseType: 'JSON', strands: strand });

    const packet = packetDeGet();
    const headers = packet.getOptions()['headers'] as Record<string, string>;
    const strandsEnviados = JSON.parse(headers['Winder-Params']);

    expect(strandsEnviados).toEqual([{ actionRoute: 'login', name: 'login_response', payload: { email: 'ana.torres@confianza.pe' }, withFormData: false }]);
  });

  it('acepta un arreglo de varios Strands en una sola request', () => {
    const s1 = new Strand('a', 'ra');
    const s2 = new Strand('b', 'rb');
    service.prepare(CONN, { responseType: 'JSON', strands: [s1, s2] });

    const packet = packetDeGet();
    const headers = packet.getOptions()['headers'] as Record<string, string>;
    const strandsEnviados = JSON.parse(headers['Winder-Params']) as Array<{ actionRoute: string }>;

    expect(strandsEnviados.map((s) => s.actionRoute)).toEqual(['a', 'b']);
  });

  it('responseType "resource" fuerza options.responseType = "blob"', () => {
    service.prepare(CONN, { responseType: 'resource', strands: new Strand('descargar') });

    const packet = packetDeGet();
    expect(packet.getOptions()['responseType']).toBe('blob');
  });

  it('post() sin archivo apunta a v1/p y envía w como postParam', () => {
    service.prepare(CONN, { responseType: 'JSON', strands: new Strand('meta') });

    service.post().subscribe();
    const packet = postSpy.mock.calls[0][0] as RESTPacket;

    expect(packet.baseRoute).toBe('v1/p');
    expect(packet.haveFormData()).toBe(false);
    expect(packet.getPostParams()['w']).toBeTruthy();
  });

  it('post() con archivo apunta a v1/pf y usa FormData en vez de postParams', () => {
    const strand = new Strand('subir_archivo');
    const archivo = new File(['contenido'], 'reporte.csv', { type: 'text/csv' });
    strand.setFile(archivo, 'file-1');
    service.prepare(CONN, { responseType: 'JSON', strands: strand });

    service.post().subscribe();
    const packet = postSpy.mock.calls[0][0] as RESTPacket;

    expect(packet.baseRoute).toBe('v1/pf');
    expect(packet.haveFormData()).toBe(true);
    expect(packet.getFormData()?.get('w')).toBeTruthy();
    expect(packet.getFormData()?.get('winder-file')).toBeInstanceOf(File);
  });

  it('el cifrado nunca contiene "+" en la URL final (reemplazado por "$")', () => {
    service.prepare(CONN, { responseType: 'JSON', strands: new Strand('login') });
    const packet = packetDeGet();

    expect(packet.computeURL()).not.toContain('+');
  });
});

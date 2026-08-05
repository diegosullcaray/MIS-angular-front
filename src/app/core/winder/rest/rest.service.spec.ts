import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RESTService } from './rest.service';
import { RESTPacket } from './rest-packet.class';
import { environment } from '../../../../environments/environment';

describe('RESTService', () => {
  let service: RESTService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RESTService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('get() hace un GET a la URL calculada por el RESTPacket', () => {
    const packet = new RESTPacket();
    packet.baseRoute = 'v1/g';
    packet.pushRouteParam('w', 'cipher123');

    service.get(packet).subscribe();

    const req = httpMock.expectOne(`${environment.requestConfigRootURL}/v1/g?w=cipher123`);
    expect(req.request.method).toBe('GET');
    req.flush({ code: '0', headers: {}, body: {} });
  });

  it('get() pasa las options del RESTPacket (ej. headers) al HttpClient', () => {
    const packet = new RESTPacket();
    packet.baseRoute = 'v1/g';
    packet.pushRouteParam('w', 'cipher123');
    packet.setOptions({ headers: { 'Winder-Params': '[]' } });

    service.get(packet).subscribe();

    const req = httpMock.expectOne(`${environment.requestConfigRootURL}/v1/g?w=cipher123`);
    expect(req.request.headers.get('Winder-Params')).toBe('[]');
    req.flush({ code: '0', headers: {}, body: {} });
  });

  it('post() sin FormData envía el body como JSON de los postParams', () => {
    const packet = new RESTPacket();
    packet.baseRoute = 'v1/p';
    packet.pushPostParam('w', 'cipher456');

    service.post(packet).subscribe();

    const req = httpMock.expectOne(`${environment.requestConfigRootURL}/v1/p`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(JSON.stringify({ w: 'cipher456' }));
    req.flush({});
  });

  it('post() con FormData envía el FormData directo como body', () => {
    const packet = new RESTPacket();
    packet.baseRoute = 'v1/pf';
    const fd = new FormData();
    fd.append('w', 'cipher789');
    packet.setFormData(fd);

    service.post(packet).subscribe();

    const req = httpMock.expectOne(`${environment.requestConfigRootURL}/v1/pf`);
    expect(req.request.body).toBe(fd);
    req.flush({});
  });
});

import { TestBed } from '@angular/core/testing';
import { CypherService } from './cypher.service';

describe('CypherService', () => {
  let service: CypherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CypherService);
  });

  it('cifra igual que el backend Ant/CryptoJS del STG (valor de referencia, AES-128-CBC, IV en ceros)', () => {
    // Valor de referencia calculado con node:crypto (aes-128-cbc) usando la
    // misma key y el mismo IV en ceros que usa el protocolo Winder — replica
    // exactamente lo que produce CryptoJS.AES.encrypt() en STG.
    const key = '8A9ABC5A76E1A86B26402C32DD355394';
    const plainText = JSON.stringify({ key, port: 6300, id: 'session', responseType: 'JSON' });
    const esperado =
      '+6vGqRNP3LnylAHnKSsB6wvXaTosuYGzq0Bu/Eu6b2tXXFw3rsqhIiN5U+xw6OgFipNdAJnlkw1iTs05KJsRQMBENsoruGzHM2TDKXaBR46w/5uUA+Y0bGQpK4lKqoJE';

    expect(service.encrypt(plainText, key)).toBe(esperado);
  });

  it('decrypt(encrypt(x)) recupera el texto plano original', () => {
    const key = 'CCAFE0F473E9B66F2EA57D46C5C3047E';
    const plainText = JSON.stringify({ email: 'ana.torres@confianza.pe', alt: 0 });

    const cifrado = service.encrypt(plainText, key);

    expect(service.decrypt(cifrado, key)).toBe(plainText);
  });

  it('encryptForRoute() reemplaza "+" por "$" para viajar seguro en query strings', () => {
    const key = '8A9ABC5A76E1A86B26402C32DD355394';
    // Este texto produce un "+" en el Base64 sin cifrar — verifica que
    // encryptForRoute() de verdad lo reemplaza, no solo que "podría" hacerlo.
    const plainText = 'probe-0-hubnvqrjd2';
    expect(service.encrypt(plainText, key)).toContain('+');

    const paraRuta = service.encryptForRoute(plainText, key);

    expect(paraRuta).not.toContain('+');
    expect(service.decryptFromRoute(paraRuta, key)).toBe(plainText);
  });
});

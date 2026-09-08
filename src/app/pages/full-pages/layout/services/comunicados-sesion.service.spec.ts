import { TestBed } from '@angular/core/testing';
import { CLAVE_COMUNICADOS_SESION, ComunicadosSesionService } from './comunicados-sesion.service';

/**
 * La mitad efímera de la regla de comunicados: lo que "Entendido" recuerda.
 *
 * Lo que se prueba acá es lo que distingue este servicio de una señal suelta:
 * que sobreviva a una recarga de página y que no se caiga si el almacenamiento
 * viene corrupto o bloqueado.
 */
describe('ComunicadosSesionService', () => {
  function crear(): ComunicadosSesionService {
    TestBed.configureTestingModule({});
    return TestBed.inject(ComunicadosSesionService);
  }

  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('arranca sin nada leído', () => {
    expect(crear().leidos()).toEqual([]);
  });

  it('marcar() lo recuerda y lo guarda', () => {
    const sesion = crear();

    sesion.marcar('comunicado-01');

    expect(sesion.yaLeido('comunicado-01')).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(CLAVE_COMUNICADOS_SESION) ?? '[]')).toEqual(['comunicado-01']);
  });

  it('marcar() dos veces el mismo id no lo duplica', () => {
    const sesion = crear();

    sesion.marcar('comunicado-01');
    sesion.marcar('comunicado-01');

    expect(sesion.leidos()).toEqual(['comunicado-01']);
  });

  // Es la razón de usar `sessionStorage` y no una señal: con F5 el aviso no vuelve.
  it('recargar la página conserva lo leído', () => {
    crear().marcar('comunicado-01');

    TestBed.resetTestingModule();

    expect(crear().yaLeido('comunicado-01')).toBe(true);
  });

  it('un almacenamiento corrupto se lee como vacío, no revienta', () => {
    sessionStorage.setItem(CLAVE_COMUNICADOS_SESION, '{no es json');

    expect(crear().leidos()).toEqual([]);
  });

  it('descarta lo guardado que no sean ids', () => {
    sessionStorage.setItem(CLAVE_COMUNICADOS_SESION, JSON.stringify(['ok', 7, null, 'otro']));

    expect(crear().leidos()).toEqual(['ok', 'otro']);
  });
});

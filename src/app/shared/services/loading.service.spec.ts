import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('empieza sin loading activo', () => {
    expect(service.cargando()).toBe(false);
    expect(service.estado()).toEqual({ isLoading: false, requestCount: 0 });
  });

  it('show() activa el loading y guarda el mensaje', () => {
    service.show('Cargando categorías...');

    expect(service.cargando()).toBe(true);
    expect(service.estado().message).toBe('Cargando categorías...');
    expect(service.estado().requestCount).toBe(1);
  });

  it('hide() solo apaga el loading cuando no quedan requests pendientes', () => {
    service.show();
    service.show(); // dos requests concurrentes

    service.hide();
    expect(service.cargando()).toBe(true); // todavía queda 1 pendiente
    expect(service.estado().requestCount).toBe(1);

    service.hide();
    expect(service.cargando()).toBe(false);
    expect(service.estado().requestCount).toBe(0);
  });

  it('hide() sin ningún show() previo no baja el contador de 0', () => {
    service.hide();
    expect(service.estado().requestCount).toBe(0);
    expect(service.cargando()).toBe(false);
  });

  it('forceHide() apaga el loading inmediatamente sin importar cuántos requests queden', () => {
    service.show();
    service.show();
    service.show();

    service.forceHide();

    expect(service.cargando()).toBe(false);
    expect(service.estado().requestCount).toBe(0);
  });

  it('estado es un signal que refleja cada cambio', () => {
    expect(service.estado()).toEqual({ isLoading: false, requestCount: 0 });

    service.show();
    expect(service.estado().isLoading).toBe(true);
    expect(service.cargando()).toBe(true);

    service.hide();
    expect(service.estado()).toEqual({ isLoading: false, requestCount: 0 });
    expect(service.cargando()).toBe(false);
  });

  describe('carga independiente de las peticiones HTTP', () => {
    it('una tanda muestra el overlay hasta que responde la primera petición', () => {
      service.iniciarPeticion();
      service.iniciarPeticion();
      service.iniciarPeticion();
      expect(service.cargando()).toBe(true);

      service.terminarPeticion();
      expect(service.cargando()).toBe(false);
      expect(service.estado().requestCount).toBe(2);
    });

    it('cuando terminan todas, la siguiente tanda vuelve a mostrar el overlay', () => {
      service.iniciarPeticion();
      service.terminarPeticion();
      expect(service.cargando()).toBe(false);

      service.iniciarPeticion();
      expect(service.cargando()).toBe(true);
    });

    it('una petición que se suma a una tanda ya respondida no vuelve a tapar la pantalla', () => {
      service.iniciarPeticion();
      service.iniciarPeticion();
      service.terminarPeticion();

      service.iniciarPeticion();
      expect(service.cargando()).toBe(false);
    });

    it('un show() manual sigue bloqueando aunque las peticiones ya respondieran', () => {
      service.show('Guardando...');
      service.iniciarPeticion();
      service.terminarPeticion();
      expect(service.cargando()).toBe(true);
      expect(service.estado().message).toBe('Guardando...');

      service.hide();
      expect(service.cargando()).toBe(false);
    });
  });
});


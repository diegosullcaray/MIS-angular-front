import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('empieza sin loading activo', () => {
    expect(service.isLoading).toBe(false);
    expect(service.currentState).toEqual({ isLoading: false, requestCount: 0 });
  });

  it('show() activa el loading y guarda el mensaje', () => {
    service.show('Cargando categorías...');

    expect(service.isLoading).toBe(true);
    expect(service.currentState.message).toBe('Cargando categorías...');
    expect(service.currentState.requestCount).toBe(1);
  });

  it('hide() solo apaga el loading cuando no quedan requests pendientes', () => {
    service.show();
    service.show(); // dos requests concurrentes

    service.hide();
    expect(service.isLoading).toBe(true); // todavía queda 1 pendiente
    expect(service.currentState.requestCount).toBe(1);

    service.hide();
    expect(service.isLoading).toBe(false);
    expect(service.currentState.requestCount).toBe(0);
  });

  it('hide() sin ningún show() previo no baja el contador de 0', () => {
    service.hide();
    expect(service.currentState.requestCount).toBe(0);
    expect(service.isLoading).toBe(false);
  });

  it('forceHide() apaga el loading inmediatamente sin importar cuántos requests queden', () => {
    service.show();
    service.show();
    service.show();

    service.forceHide();

    expect(service.isLoading).toBe(false);
    expect(service.currentState.requestCount).toBe(0);
  });

  // El estado es un signal y no un observable: en modo zoneless una emisión de
  // RxJS no marca la vista para refresco y el overlay quedaba pintado con el
  // estado ya apagado, tapando la pantalla entera.
  it('estado es un signal que refleja cada cambio', () => {
    expect(service.estado()).toEqual({ isLoading: false, requestCount: 0 });

    service.show();
    expect(service.estado().isLoading).toBe(true);
    expect(service.cargando()).toBe(true);

    service.hide();
    expect(service.estado()).toEqual({ isLoading: false, requestCount: 0 });
    expect(service.cargando()).toBe(false);
  });
});

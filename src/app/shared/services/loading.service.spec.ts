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

  it('loading$ emite cada cambio de estado', () => {
    const emisiones: boolean[] = [];
    service.loading$.subscribe((state) => emisiones.push(state.isLoading));

    service.show();
    service.hide();

    expect(emisiones).toEqual([false, true, false]);
  });
});

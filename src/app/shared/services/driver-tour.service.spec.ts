import { TestBed } from '@angular/core/testing';
import { DriverTourService } from './driver-tour.service';

const driveMock = vi.fn();
const destroyMock = vi.fn();
const driverFactoryMock = vi.fn((_config: unknown) => ({ drive: driveMock, destroy: destroyMock }));

vi.mock('driver.js', () => ({
  driver: (config: unknown) => driverFactoryMock(config),
}));

describe('DriverTourService', () => {
  let service: DriverTourService;

  beforeEach(() => {
    driveMock.mockClear();
    destroyMock.mockClear();
    driverFactoryMock.mockClear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(DriverTourService);
  });

  it('no tiene un tour activo al inicio', () => {
    expect(service.isActive()).toBe(false);
  });

  it('startTour() crea el driver con la configuración combinada y arranca el tour', () => {
    service.startTour({ steps: [{ element: '#paso-1', popover: { title: 'Paso 1' } }] });

    expect(driverFactoryMock).toHaveBeenCalledTimes(1);
    const configUsada = driverFactoryMock.mock.calls[0][0] as Record<string, unknown>;
    expect(configUsada['steps']).toEqual([{ element: '#paso-1', popover: { title: 'Paso 1' } }]);
    expect(configUsada['nextBtnText']).toBe('Siguiente');
    expect(driveMock).toHaveBeenCalledTimes(1);
    expect(service.isActive()).toBe(true);
  });

  it('createQuickTour() arma la config a partir de los pasos dados', () => {
    const pasos = [{ element: '#a', popover: { title: 'A' } }];
    service.createQuickTour(pasos, { showProgress: false });

    const configUsada = driverFactoryMock.mock.calls[0][0] as Record<string, unknown>;
    expect(configUsada['steps']).toBe(pasos);
    expect(configUsada['showProgress']).toBe(false);
  });

  it('destroyCurrentTour() destruye el tour activo y limpia la referencia', () => {
    service.startTour({ steps: [] });
    expect(service.isActive()).toBe(true);

    service.destroyCurrentTour();

    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(service.isActive()).toBe(false);
  });

  it('destroyCurrentTour() no falla si no hay tour activo', () => {
    expect(() => service.destroyCurrentTour()).not.toThrow();
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('startTour() destruye cualquier tour previo antes de iniciar uno nuevo', () => {
    service.startTour({ steps: [] });
    service.startTour({ steps: [] });

    expect(destroyMock).toHaveBeenCalledTimes(1); // el primer tour se destruye al iniciar el segundo
    expect(driverFactoryMock).toHaveBeenCalledTimes(2);
  });

  it('forceClose() destruye el tour y elimina overlays/popovers residuales del DOM', () => {
    document.body.innerHTML = '<div class="driver-overlay"></div><div class="driver-popover"></div><div id="ajeno"></div>';
    service.startTour({ steps: [] });

    service.forceClose();

    expect(destroyMock).toHaveBeenCalled();
    expect(document.querySelector('.driver-overlay')).toBeNull();
    expect(document.querySelector('.driver-popover')).toBeNull();
    expect(document.querySelector('#ajeno')).not.toBeNull();
  });
});

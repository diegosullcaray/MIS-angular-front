import { TestBed } from '@angular/core/testing';
import type { DriverTourService } from './driver-tour.service';

// vi.mock() se hoistea sobre los imports, así que la factory no puede cerrar
// sobre consts normales del módulo (todavía no existirían en ese punto) —
// vi.hoisted() sube también la creación de los mocks para que estén listas.
const { driveMock, destroyMock, setStepsMock, moveToMock, driverFactoryMock } = vi.hoisted(() => {
  const driveMock = vi.fn();
  const destroyMock = vi.fn();
  const setStepsMock = vi.fn();
  const moveToMock = vi.fn();
  const driverFactoryMock = vi.fn((_config: unknown) => ({
    drive: driveMock,
    destroy: destroyMock,
    setSteps: setStepsMock,
    moveTo: moveToMock,
    isActive: () => true,
    getActiveIndex: () => 1,
  }));
  return { driveMock, destroyMock, setStepsMock, moveToMock, driverFactoryMock };
});

vi.mock('driver.js', () => ({
  driver: (config: unknown) => driverFactoryMock(config),
}));

describe('DriverTourService', () => {
  let service: DriverTourService;

  beforeEach(async () => {
    driveMock.mockClear();
    destroyMock.mockClear();
    setStepsMock.mockClear();
    moveToMock.mockClear();
    driverFactoryMock.mockClear();

    // Esta suite corre con --isolate=false (un solo realm de JS para todos
    // los specs, ver angular.json), así que si otro spec ya importó
    // driver-tour.service.ts antes que este archivo registrara su vi.mock,
    // ese módulo quedaría con el `driver()` real de driver.js "de fábrica".
    // vi.resetModules() + import() dinámico fuerzan una reevaluación fresca
    // del módulo, ahora sí con el mock ya activo.
    vi.resetModules();
    const { DriverTourService: DriverTourServiceCtor } = await import('./driver-tour.service');

    TestBed.configureTestingModule({});
    service = TestBed.inject(DriverTourServiceCtor);
  });

  // Cada test arma un servicio nuevo (`vi.resetModules()`). Si el recorrido del
  // test anterior queda abierto, sus escuchas de `resize` siguen vivas y
  // responden al evento de este.
  afterEach(() => service.destroyCurrentTour());

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

  /**
   * El reacomodo en pantalla angosta. Antes había una tabla con un caso
   * especial para `#tour-sidebar-icons`; ahora el lado se mide contra el
   * viewport, así que cubre cualquier elemento del borde inferior y este
   * servicio compartido deja de saber dónde vive el rail del layout.
   */
  describe('reacomodo en pantalla angosta', () => {
    const ALTO = 800;
    let anchoOriginal: number;
    let altoOriginal: number;

    /** jsdom no hace layout: la caja de cada ancla se declara acá. */
    function anclar(id: string, top: number, height = 40): void {
      const elemento = document.createElement('div');
      elemento.id = id;
      elemento.getBoundingClientRect = () =>
        ({ top, height, width: 100, bottom: top + height, left: 0, right: 100, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
      document.body.append(elemento);
    }

    function fijar(propiedad: 'innerWidth' | 'innerHeight', valor: number): void {
      Object.defineProperty(window, propiedad, { writable: true, configurable: true, value: valor });
    }

    beforeEach(() => {
      anchoOriginal = window.innerWidth;
      altoOriginal = window.innerHeight;
      document.body.innerHTML = '';
      fijar('innerWidth', 375);
      fijar('innerHeight', ALTO);
    });

    afterEach(() => {
      fijar('innerWidth', anchoOriginal);
      fijar('innerHeight', altoOriginal);
      document.body.innerHTML = '';
    });

    function pasosUsados(): Array<{ element?: string; popover?: { side?: string; align?: string } }> {
      const configUsada = driverFactoryMock.mock.calls[0][0] as Record<string, unknown>;
      return configUsada['steps'] as Array<{ element?: string; popover?: { side?: string; align?: string } }>;
    }

    it('un ancla en la mitad de abajo manda el globo arriba', () => {
      anclar('rail', ALTO - 60);

      service.startTour({ steps: [{ element: '#rail', popover: { title: 'Barra', side: 'right' } }] });

      expect(pasosUsados()[0].popover?.side).toBe('top');
      expect(pasosUsados()[0].popover?.align).toBe('center');
    });

    it('un ancla en la mitad de arriba manda el globo abajo', () => {
      anclar('cabecera', 10);

      service.startTour({ steps: [{ element: '#cabecera', popover: { title: 'Header', side: 'left' } }] });

      expect(pasosUsados()[0].popover?.side).toBe('bottom');
    });

    // Sin caja que medir sigue valiendo lo evidente: al costado no entra.
    it('un ancla que no resuelve cae a `bottom` si pedía un costado', () => {
      service.startTour({ steps: [{ element: '#no-existe', popover: { title: 'X', side: 'right' } }] });

      expect(pasosUsados()[0].popover?.side).toBe('bottom');
    });

    // driver.js pinta centrado un paso sin ancla: es la tarjeta que explica
    // algo que no está en esta pantalla.
    it('un paso sin ancla se deja como está', () => {
      service.startTour({ steps: [{ popover: { title: 'Tarjeta' } }] });

      expect(pasosUsados()[0].popover?.side).toBeUndefined();
      expect(pasosUsados()[0].element).toBeUndefined();
    });

    it('el relleno del recuadro se achica', () => {
      service.startTour({ steps: [] });

      expect((driverFactoryMock.mock.calls[0][0] as Record<string, unknown>)['stagePadding']).toBe(4);
    });

    // Girar el teléfono a mitad del recorrido dejaba el globo contra el borde
    // equivocado: el ancho se leía una sola vez, al arrancar.
    it('girar el teléfono recalcula los lados y vuelve al paso activo', async () => {
      anclar('rail', ALTO - 60);
      service.startTour({ steps: [{ element: '#rail', popover: { title: 'Barra', side: 'right' } }] });

      window.dispatchEvent(new Event('orientationchange'));
      await new Promise((listo) => setTimeout(listo, 200));

      expect(setStepsMock).toHaveBeenCalledTimes(1);
      expect(moveToMock).toHaveBeenCalledWith(1);
    });
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

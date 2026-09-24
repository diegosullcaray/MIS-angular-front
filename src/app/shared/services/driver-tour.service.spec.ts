import { TestBed } from '@angular/core/testing';
import type { DriverTourService } from './driver-tour.service';

// vi.mock() se hoistea sobre los imports, así que la factory no puede cerrar
// sobre consts normales del módulo (todavía no existirían en ese punto) —
// vi.hoisted() sube también la creación de los mocks para que estén listas.
const { driveMock, destroyMock, setStepsMock, refreshMock, moveNextMock, driverFactoryMock } = vi.hoisted(() => {
  const moveNextMock = vi.fn();
  const driveMock = vi.fn();
  const destroyMock = vi.fn();
  const setStepsMock = vi.fn();
  const refreshMock = vi.fn();
  const driverFactoryMock = vi.fn((_config: unknown) => ({
    drive: driveMock,
    destroy: destroyMock,
    setSteps: setStepsMock,
    refresh: refreshMock,
    moveNext: moveNextMock,
    isActive: () => true,
    getActiveIndex: () => 1,
  }));
  return { driveMock, destroyMock, setStepsMock, refreshMock, moveNextMock, driverFactoryMock };
});

type PasoUsado = { element?: unknown; popover?: { side?: string; align?: string; title?: string } };

/** Resuelve el ancla de un paso como lo haría driver.js al llegar a él. */
function anclaDe(paso: PasoUsado): Element | null {
  const ancla = paso.element;
  if (typeof ancla === 'function') return (ancla as () => Element | null)();
  if (typeof ancla === 'string') return document.querySelector(ancla);
  return (ancla as Element | undefined) ?? null;
}

vi.mock('driver.js', () => ({
  driver: (config: unknown) => driverFactoryMock(config),
}));

describe('DriverTourService', () => {
  let service: DriverTourService;

  beforeEach(async () => {
    driveMock.mockClear();
    destroyMock.mockClear();
    setStepsMock.mockClear();
    refreshMock.mockClear();
    moveNextMock.mockClear();
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
    const pasos = configUsada['steps'] as PasoUsado[];
    expect(pasos).toHaveLength(1);
    expect(pasos[0].popover).toEqual({ title: 'Paso 1' });
    expect(configUsada['nextBtnText']).toBe('Siguiente');
    expect(driveMock).toHaveBeenCalledTimes(1);
    expect(service.isActive()).toBe(true);
  });

  it('createQuickTour() arma la config a partir de los pasos dados', () => {
    const pasos = [{ element: '#a', popover: { title: 'A' } }];
    service.createQuickTour(pasos, { showProgress: false });

    const configUsada = driverFactoryMock.mock.calls[0][0] as Record<string, unknown>;
    expect((configUsada['steps'] as PasoUsado[]).map((p) => p.popover)).toEqual([{ title: 'A' }]);
    expect(configUsada['showProgress']).toBe(false);
  });

  describe('resaltado seguro', () => {
    type Gancho = (el: Element | undefined, paso: unknown, opts: unknown) => void;
    const turno = () => new Promise((listo) => setTimeout(listo, 0));

    function pasoUsado(i = 0): PasoUsado & { advanceOnClick?: boolean; onHighlightStarted?: Gancho } {
      return ((driverFactoryMock.mock.calls[0][0] as Record<string, unknown>)['steps'] as never[])[i];
    }

    afterEach(() => (document.body.innerHTML = ''));

    // driver.js ignoraba el clic si llegaba durante su animación: la app abría
    // el menú, el recorrido no avanzaba y el segundo clic lo cerraba.
    it('un paso advanceOnClick avanza con el clic aunque driver.js esté animando', () => {
      const boton = document.createElement('button');
      document.body.append(boton);
      service.startTour({ steps: [{ element: 'button', advanceOnClick: true, popover: { title: 'A' } }, { popover: { title: 'B' } }] });

      const paso = pasoUsado();
      expect(paso.advanceOnClick).toBe(false);
      paso.onHighlightStarted?.(boton, paso, {});
      boton.click();
      boton.click();

      expect(moveNextMock).toHaveBeenCalledTimes(1);
    });

    it('un paso normal no avanza con el clic en el elemento', () => {
      const boton = document.createElement('button');
      document.body.append(boton);
      service.startTour({ steps: [{ element: 'button', popover: { title: 'A' } }] });

      pasoUsado().onHighlightStarted?.(boton, pasoUsado(), {});
      boton.click();

      expect(moveNextMock).not.toHaveBeenCalled();
    });

    it('repone los atributos ARIA que driver.js pisa y no devuelve', async () => {
      const perfil = document.createElement('div');
      perfil.setAttribute('aria-haspopup', 'true');
      const otro = document.createElement('div');
      document.body.append(perfil, otro);
      service.startTour({ steps: [{ element: 'div', popover: { title: 'A' } }, { popover: { title: 'B' } }] });

      pasoUsado().onHighlightStarted?.(perfil, pasoUsado(), {});
      // Lo que hace driver.js al resaltar y al pasar al paso siguiente.
      perfil.setAttribute('aria-haspopup', 'dialog');
      perfil.classList.add('driver-active-element');
      await turno(); // el usuario pulsa "Siguiente" en otro turno
      pasoUsado(1).onHighlightStarted?.(otro, pasoUsado(1), {});
      perfil.removeAttribute('aria-haspopup');
      otro.classList.add('driver-active-element');
      await turno();

      expect(perfil.getAttribute('aria-haspopup')).toBe('true');
      // Y la marca de resaltado queda solo en el paso actual.
      expect(perfil.classList.contains('driver-active-element')).toBe(false);
      expect(otro.classList.contains('driver-active-element')).toBe(true);
    });

    // La lupa abre el buscador durante su paso: reponer el `false` del comienzo
    // la dejaba anunciando "cerrado" con el buscador abierto.
    it('respeta el ARIA que la app cambia mientras el elemento está resaltado', async () => {
      const lupa = document.createElement('button');
      lupa.setAttribute('aria-expanded', 'false');
      document.body.append(lupa);
      service.startTour({ steps: [{ element: 'button', popover: { title: 'A' } }, { popover: { title: 'B' } }] });

      pasoUsado().onHighlightStarted?.(lupa, pasoUsado(), {});
      lupa.setAttribute('aria-expanded', 'true'); // driver.js
      lupa.classList.add('driver-active-element');
      await turno();
      lupa.setAttribute('aria-expanded', 'false'); // la app, por ejemplo
      lupa.setAttribute('aria-expanded', 'true'); // …y vuelve a abrir
      pasoUsado(1).onHighlightStarted?.(undefined, pasoUsado(1), {});
      lupa.removeAttribute('aria-expanded'); // limpieza de driver.js
      await turno();

      expect(lupa.getAttribute('aria-expanded')).toBe('true');
    });

    it('al cerrar repone el ARIA del último elemento resaltado', async () => {
      const perfil = document.createElement('div');
      perfil.setAttribute('aria-haspopup', 'true');
      document.body.append(perfil);
      service.startTour({ steps: [{ element: 'div', popover: { title: 'A' } }] });

      pasoUsado().onHighlightStarted?.(perfil, pasoUsado(), {});
      await turno();
      // Lo que driver.js hace con el elemento activo al cerrar.
      destroyMock.mockImplementationOnce(() => perfil.removeAttribute('aria-haspopup'));
      service.destroyCurrentTour();

      expect(perfil.getAttribute('aria-haspopup')).toBe('true');
    });

    it('conserva el gancho onHighlightStarted de quien llama', () => {
      const propio = vi.fn();
      service.startTour({ steps: [{ popover: { title: 'A' } }], onHighlightStarted: propio });

      pasoUsado().onHighlightStarted?.(undefined, pasoUsado(), {});
      expect(propio).toHaveBeenCalledTimes(1);
    });
  });

  describe('anclas que se resuelven al llegar al paso', () => {
    function ancla(id: string, ancho: number): HTMLElement {
      const elemento = document.createElement('div');
      elemento.id = id;
      elemento.getBoundingClientRect = () =>
        ({ top: 0, height: ancho, width: ancho, bottom: ancho, left: 0, right: ancho, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
      document.body.append(elemento);
      return elemento;
    }

    afterEach(() => (document.body.innerHTML = ''));

    it('un ancla visible se resalta tal cual', () => {
      const visible = ancla('visible', 40);
      service.startTour({ steps: [{ element: '#visible', popover: { title: 'A' } }] });

      const [paso] = (driverFactoryMock.mock.calls[0][0] as Record<string, unknown>)['steps'] as PasoUsado[];
      expect(anclaDe(paso)).toBe(visible);
    });

    // En móvil la columna de ajustes existe pero mide 0×0: resaltarla dejaba al
    // usuario mirando la nada. Ahora el globo va centrado.
    it('un ancla que existe pero no ocupa lugar se pinta centrada', () => {
      ancla('oculta', 0);
      service.startTour({ steps: [{ element: '#oculta', popover: { title: 'A' } }] });

      const [paso] = (driverFactoryMock.mock.calls[0][0] as Record<string, unknown>)['steps'] as PasoUsado[];
      expect(anclaDe(paso)?.id).toBe('driver-dummy-element');
    });

    it('un ancla que aparece después (el diálogo del paso anterior) se encuentra al llegar', () => {
      service.startTour({ steps: [{ element: '#tarde', popover: { title: 'A' } }] });
      const [paso] = (driverFactoryMock.mock.calls[0][0] as Record<string, unknown>)['steps'] as PasoUsado[];
      expect(anclaDe(paso)).toBeNull();

      const tarde = ancla('tarde', 40);
      expect(anclaDe(paso)).toBe(tarde);
    });
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

    function pasosUsados(llamada = 0): PasoUsado[] {
      const configUsada = driverFactoryMock.mock.calls[llamada][0] as Record<string, unknown>;
      return configUsada['steps'] as PasoUsado[];
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

      // Al girar, el rail pasa a la mitad de arriba: el globo tiene que ir abajo.
      (document.getElementById('rail') as HTMLElement).getBoundingClientRect = () =>
        ({ top: 10, height: 40, width: 100, bottom: 50, left: 0, right: 100, x: 0, y: 10, toJSON: () => ({}) }) as DOMRect;
      window.dispatchEvent(new Event('orientationchange'));
      await new Promise((listo) => setTimeout(listo, 200));

      // `setSteps()` de driver.js resetea su estado y dejaba overlays huérfanos:
      // se rearma la instancia y se retoma el mismo paso.
      expect(setStepsMock).not.toHaveBeenCalled();
      expect(destroyMock).toHaveBeenCalledTimes(1);
      expect(driverFactoryMock).toHaveBeenCalledTimes(2);
      expect(pasosUsados(1)[0].popover?.side).toBe('bottom');
      expect(driveMock).toHaveBeenLastCalledWith(1);
      expect(service.isActive()).toBe(true);
    });

    it('si los lados no cambian, reacomodar es solo refrescar', async () => {
      anclar('rail', ALTO - 60);
      service.startTour({ steps: [{ element: '#rail', popover: { title: 'Barra', side: 'right' } }] });

      window.dispatchEvent(new Event('resize'));
      await new Promise((listo) => setTimeout(listo, 200));

      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(destroyMock).not.toHaveBeenCalled();
      expect(driverFactoryMock).toHaveBeenCalledTimes(1);
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

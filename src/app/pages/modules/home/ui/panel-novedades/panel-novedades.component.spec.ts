import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PanelNovedadesComponent } from './panel-novedades.component';
import { NovedadesTourService } from '../../services/novedades-tour.service';

describe('PanelNovedadesComponent', () => {
  let servicioNovedadesTourFalso: Partial<NovedadesTourService>;

  beforeEach(() => {
    // Ancho de escritorio: el panel arranca abierto.
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);

    // Mockeamos la implementación real para solo sobreescribir 'iniciar'
    servicioNovedadesTourFalso = {
      iniciar: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PanelNovedadesComponent],
      providers: [
        provideRouter([]),
        // Proveemos el original para 'novedades', 'esNueva'
        NovedadesTourService,
      ],
    });

    // Sobrescribimos el servicio después de crearlo para mantener los datos de Novedades originales
    const realService = TestBed.inject(NovedadesTourService);
    vi.spyOn(realService, 'iniciar').mockImplementation(servicioNovedadesTourFalso.iniciar as any);
  });

  afterEach(() => vi.restoreAllMocks());

  function crear() {
    const fixture = TestBed.createComponent(PanelNovedadesComponent);
    fixture.detectChanges();
    return fixture;
  }

  function el(fixture: ReturnType<typeof crear>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('lista una novedad por cada una del catálogo, con su título', () => {
    const fixture = crear();
    const servicio = TestBed.inject(NovedadesTourService);

    const botones = el(fixture).querySelectorAll('.novedad');

    expect(botones.length).toBe(servicio.novedades.length);
    expect(el(fixture).textContent).toContain(servicio.novedades[0].titulo);
  });

  it('las ordena de la más reciente a la más antigua', () => {
    const servicio = TestBed.inject(NovedadesTourService);

    const fechas = servicio.novedades.map((n) => n.fecha);

    expect([...fechas].sort((a, b) => b.localeCompare(a))).toEqual(fechas);
  });

  it('filtra las novedades por tema y Baby Pachi muestra la pose del tema elegido', () => {
    const fixture = crear();
    const servicio = TestBed.inject(NovedadesTourService);
    const novedad = servicio.novedades.find((item) => item.categoria === 'Buscar')!;

    // En vez de interactuar con el DOM, llamamos al método que el componente expone para filtrar
    fixture.componentInstance.filtrar('Buscar');
    fixture.detectChanges();

    expect(el(fixture).querySelectorAll('.novedad').length).toBe(1);
    expect(el(fixture).textContent).toContain(novedad.titulo);
    expect(el(fixture).querySelector<HTMLImageElement>('.novedades-mascota')?.src).toContain(
      `mascota-${novedad.posePachi}.png`,
    );
  });

  it('al elegir una novedad, prepara la pantalla y arranca su recorrido guiado', async () => {
    const fixture = crear();
    const servicio = TestBed.inject(NovedadesTourService);

    (el(fixture).querySelector('.novedad') as HTMLButtonElement).click();
    await esperarInteraccion();

    expect(servicio.iniciar).toHaveBeenCalledTimes(1);
    expect(servicio.iniciar).toHaveBeenCalledWith(servicio.novedades[0].id);
  });

  it('cada paso muestra a la mascota junto al texto de la guía', () => {
    const servicio = TestBed.inject(NovedadesTourService);

    for (const novedad of servicio.novedades) {
      expect(novedad.pasos.length).toBeGreaterThan(0);
      for (const paso of novedad.pasos) {
        expect(paso.popover?.description).toContain('/assets/images/fc/tours/mascota-');
        // Decorativa: el mensaje lo lleva el texto, no la imagen.
        expect(paso.popover?.description).toContain('alt=""');
      }
    }
  });

  it('en escritorio arranca abierto y la pestaña de reapertura no está', () => {
    const fixture = crear();

    expect(el(fixture).querySelector('.novedades--cerrado')).toBeNull();
    expect(el(fixture).querySelector('.novedades-pestania')).toBeNull();
  });

  it('se pliega contra el borde y deja la pestaña para volver a abrirlo', () => {
    const fixture = crear();

    (el(fixture).querySelector('.novedades-cerrar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el(fixture).querySelector('.novedades--cerrado')).not.toBeNull();
    const pestania = el(fixture).querySelector('.novedades-pestania') as HTMLButtonElement;
    expect(pestania).not.toBeNull();

    pestania.click();
    fixture.detectChanges();

    expect(el(fixture).querySelector('.novedades--cerrado')).toBeNull();
  });

  it('plegado queda inerte, para que no reciba foco fuera de pantalla', () => {
    const fixture = crear();

    (el(fixture).querySelector('.novedades-cerrar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el(fixture).querySelector('#novedades-panel')?.hasAttribute('inert')).toBe(true);
  });

  it('en pantallas angostas arranca plegado, para no tapar el Home', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(900);

    const fixture = crear();

    expect(el(fixture).querySelector('.novedades--cerrado')).not.toBeNull();
    expect(el(fixture).querySelector('.novedades-pestania')).not.toBeNull();
  });

  /**
   * El panel está encima de la pantalla y en angosto ocupa todo el ancho: si
   * queda abierto, el recorrido resalta algo que el propio panel está tapando.
   */
  describe('el panel se aparta del recorrido', () => {
    function novedadPorId(id: string): number {
      return TestBed.inject(NovedadesTourService).novedades.findIndex((n) => n.id === id);
    }

    it('al elegir una novedad que señala la pantalla, el panel se cierra', async () => {
      const fixture = crear();
      const servicio = TestBed.inject(NovedadesTourService);
      const indice = novedadPorId('busqueda-global');

      (el(fixture).querySelectorAll('.novedad')[indice] as HTMLButtonElement).click();
      await esperarInteraccion();
      fixture.detectChanges();

      expect(el(fixture).querySelector('.novedades--cerrado')).not.toBeNull();
      expect(servicio.iniciar).toHaveBeenCalledTimes(1);
    });

    it('las novedades útiles cierran el panel antes de señalar la pantalla', async () => {
      const fixture = crear();
      const indice = novedadPorId('busqueda-global');

      (el(fixture).querySelectorAll('.novedad')[indice] as HTMLButtonElement).click();
      await esperarInteraccion();
      fixture.detectChanges();

      expect(el(fixture).querySelector('.novedades--cerrado')).not.toBeNull();
    });

    it('abrir() lo levanta desde afuera — es la puerta de la bienvenida', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);
      const fixture = crear();
      expect(el(fixture).querySelector('.novedades--cerrado')).not.toBeNull();

      fixture.componentInstance.abrir();
      fixture.detectChanges();

      expect(el(fixture).querySelector('.novedades--cerrado')).toBeNull();
    });
  });

  function esperarInteraccion(): Promise<void> {
    return new Promise((resolver) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolver())),
    );
  }
});

import { TestBed } from '@angular/core/testing';
import { PanelNovedadesComponent } from './panel-novedades.component';
import { NovedadesTourService } from '../../services/novedades-tour.service';
import { DriverTourService } from '../../../../../shared/services/driver-tour.service';

describe('PanelNovedadesComponent', () => {
  let tourFalso: { createQuickTour: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tourFalso = { createQuickTour: vi.fn() };
    // Ancho de escritorio: el panel arranca abierto.
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);

    TestBed.configureTestingModule({
      imports: [PanelNovedadesComponent],
      providers: [{ provide: DriverTourService, useValue: tourFalso }],
    });
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

  it('al elegir una novedad, arranca su recorrido guiado', () => {
    const fixture = crear();
    const servicio = TestBed.inject(NovedadesTourService);

    (el(fixture).querySelector('.novedad') as HTMLButtonElement).click();

    expect(tourFalso.createQuickTour).toHaveBeenCalledTimes(1);
    const pasos = tourFalso.createQuickTour.mock.calls[0][0];
    expect(pasos).toEqual(servicio.novedades[0].pasos);
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
});

import { TestBed } from '@angular/core/testing';
import { NovedadesTourService } from './novedades-tour.service';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';

describe('NovedadesTourService', () => {
  let driverFalso: { createQuickTour: ReturnType<typeof vi.fn> };
  let servicio: NovedadesTourService;

  beforeEach(() => {
    driverFalso = { createQuickTour: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: DriverTourService, useValue: driverFalso }],
    });
    servicio = TestBed.inject(NovedadesTourService);
  });

  it('publica el catálogo ordenado de la novedad más reciente a la más antigua', () => {
    const fechas = servicio.novedades.map((n) => n.fecha);

    expect(servicio.novedades.length).toBeGreaterThan(0);
    expect([...fechas].sort((a, b) => b.localeCompare(a))).toEqual(fechas);
  });

  it('cada novedad trae id único, resumen y al menos un paso', () => {
    const ids = servicio.novedades.map((n) => n.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const novedad of servicio.novedades) {
      expect(novedad.titulo.length).toBeGreaterThan(0);
      expect(novedad.resumen.length).toBeGreaterThan(0);
      expect(novedad.pasos.length).toBeGreaterThan(0);
    }
  });

  it('todo paso apunta a un ancla y la explica con la mascota', () => {
    for (const novedad of servicio.novedades) {
      for (const paso of novedad.pasos) {
        expect(paso.element).toBeTruthy();
        expect(paso.popover?.title).toBeTruthy();
        expect(paso.popover?.description).toContain('/assets/images/fc/tours/mascota-');
        // Decorativa: el mensaje lo lleva el texto, no la imagen.
        expect(paso.popover?.description).toContain('alt=""');
      }
    }
  });

  it('iniciar() delega los pasos de esa novedad en el motor de tours', () => {
    const primera = servicio.novedades[0];

    servicio.iniciar(primera.id);

    expect(driverFalso.createQuickTour).toHaveBeenCalledTimes(1);
    expect(driverFalso.createQuickTour.mock.calls[0][0]).toEqual(primera.pasos);
  });

  it('iniciar() con un id inexistente no arranca ningún recorrido', () => {
    servicio.iniciar('no-existe');

    expect(driverFalso.createQuickTour).not.toHaveBeenCalled();
  });

  it('esNueva() distingue lo publicado hace poco de lo viejo, según la fecha de la novedad', () => {
    const novedad = servicio.novedades[0];
    const publicada = Date.parse(novedad.fecha);
    const DIA = 24 * 60 * 60 * 1000;

    expect(servicio.esNueva(novedad, publicada + 5 * DIA)).toBe(true);
    expect(servicio.esNueva(novedad, publicada + 60 * DIA)).toBe(false);
  });

  it('una fecha inválida no se cuenta como novedad reciente', () => {
    const rota = { ...servicio.novedades[0], fecha: 'ayer' };

    expect(servicio.esNueva(rota)).toBe(false);
  });
});

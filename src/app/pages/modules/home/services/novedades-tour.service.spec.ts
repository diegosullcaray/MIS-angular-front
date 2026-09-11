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

  it('todo paso tiene título y lo explica Pachi', () => {
    for (const novedad of servicio.novedades) {
      for (const paso of novedad.pasos) {
        expect(paso.popover?.title).toBeTruthy();
        expect(paso.popover?.description).toContain('/assets/images/fc/tours/mascota-');
        // Decorativa: el mensaje lo lleva el texto, no la imagen.
        expect(paso.popover?.description).toContain('alt=""');
      }
    }
  });

  /**
   * Un paso sin `element` es deliberado: driver.js lo pinta centrado, que es
   * lo que corresponde cuando la novedad habla de algo que no está en esta
   * pantalla —los filtros viven en los reportes, no en el Home—.
   */
  it('un paso, o apunta a un ancla, o es una tarjeta centrada a propósito', () => {
    const sinAncla = servicio.novedades.flatMap((n) => n.pasos).filter((p) => !p.element);

    expect(sinAncla.length).toBeGreaterThan(0);
    for (const paso of sinAncla) {
      // Sin ancla no hay lado que elegir: driver.js la centra.
      expect(paso.popover?.side).toBeUndefined();
    }
  });

  it('Pachi se presenta por su nombre en el catálogo', () => {
    const textos = servicio.novedades.flatMap((n) => n.pasos).map((p) => String(p.popover?.description ?? ''));

    expect(textos.some((t) => t.includes('Pachi'))).toBe(true);
  });

  it('solo el recorrido del propio panel pide tenerlo a la vista', () => {
    const conPanel = servicio.novedades.filter((n) => n.requierePanel).map((n) => n.id);

    expect(conPanel).toEqual(['panel-novedades']);
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

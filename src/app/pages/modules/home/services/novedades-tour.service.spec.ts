import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NovedadesTourService } from './novedades-tour.service';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';

describe('NovedadesTourService', () => {
  let driverFalso: { createQuickTour: ReturnType<typeof vi.fn>; forceClose: ReturnType<typeof vi.fn> };
  let servicio: NovedadesTourService;

  beforeEach(() => {
    driverFalso = { createQuickTour: vi.fn(), forceClose: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: DriverTourService, useValue: driverFalso }],
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



  it('Pachi se presenta por su nombre en el catálogo', () => {
    const textos = servicio.novedades
      .flatMap((n) => n.pasos)
      .map((p) => String(p.popover?.description ?? ''));

    expect(textos.some((t) => t.includes('Pachi'))).toBe(true);
  });

  it('solo publica recorridos que señalan funciones del sistema, no el panel de novedades', () => {
    expect(servicio.novedades.map((n) => n.id)).toEqual([
      'busqueda-global',
      'sistemas-y-paneles',
      'configuracion-personal',
    ]);
  });

  it('iniciar() prepara la interfaz y delega los pasos de esa novedad en el motor de tours', async () => {
    const primera = servicio.novedades[0];

    await servicio.iniciar(primera.id);

    expect(driverFalso.forceClose).toHaveBeenCalled();
    expect(driverFalso.createQuickTour).toHaveBeenCalledTimes(1);
    const esperados = primera.pasos.map((p) =>
      p.advanceOnClick ? { ...p, disableActiveInteraction: false } : p
    );
    expect(driverFalso.createQuickTour.mock.calls[0][0]).toEqual(esperados);
    // Espera corta: con 2,5 s un ancla ausente dejaba "Siguiente" sin respuesta.
    expect(driverFalso.createQuickTour.mock.calls[0][1].waitForElement).toBeLessThanOrEqual(1_500);
  });

  it('un doble clic en la guía arranca un solo recorrido', async () => {
    const id = servicio.novedades[0].id;

    await Promise.all([servicio.iniciar(id), servicio.iniciar(id)]);

    expect(driverFalso.createQuickTour).toHaveBeenCalledTimes(1);
  });

  // Antes la búsqueda se abría sola: la lupa pasaba a "Cerrar búsqueda global",
  // el paso 1 perdía su ancla y el 5 dejaba el recorrido colgado.
  it('la búsqueda global espera el clic del usuario y su ancla vale abierta y cerrada', async () => {
    const lupa = document.createElement('button');
    lupa.setAttribute('aria-label', 'Abrir búsqueda global');
    const clic = vi.fn();
    lupa.addEventListener('click', clic);
    const header = document.createElement('header');
    header.append(lupa);
    document.body.append(header);

    await servicio.iniciar('busqueda-global');

    expect(clic).not.toHaveBeenCalled();
    const pasos = driverFalso.createQuickTour.mock.calls[0][0];
    expect(pasos[0].advanceOnClick).toBe(true);
    const selector = String(pasos[0].element);
    expect(document.querySelector(selector)).toBe(lupa);
    lupa.setAttribute('aria-label', 'Cerrar búsqueda global');
    expect(document.querySelector(String(pasos.at(-1).element))).toBe(lupa);
    header.remove();
  });

  it('Configuración enseña el camino: espera el clic en el perfil y en la opción', () => {
    const config = servicio.novedades.find((n) => n.id === 'configuracion-personal')!;
    const conClic = config.pasos.filter((p) => p.advanceOnClick).map((p) => p.element);

    expect(conClic).toEqual(['header [aria-haspopup="true"]', '.perfil-menu .perfil-item']);
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

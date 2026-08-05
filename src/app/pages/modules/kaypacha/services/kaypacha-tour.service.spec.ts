import { TestBed } from '@angular/core/testing';
import { KaypachaTourService } from './kaypacha-tour.service';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';

describe('KaypachaTourService', () => {
  let service: KaypachaTourService;
  let driverFalso: { createQuickTour: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    driverFalso = { createQuickTour: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: DriverTourService, useValue: driverFalso }],
    });
    service = TestBed.inject(KaypachaTourService);
  });

  it('iniciarTourGuiado() arma los 8 pasos del tour guiado del módulo, en orden', () => {
    service.iniciarTourGuiado();

    expect(driverFalso.createQuickTour).toHaveBeenCalledTimes(1);
    const pasos = driverFalso.createQuickTour.mock.calls[0][0] as Array<{ element: string }>;
    expect(pasos.map((p) => p.element)).toEqual([
      '#tour-kaypacha-header',
      '#tour-kaypacha-cambiar-btn',
      '#tour-kaypacha-limpiar-btn',
      '#tour-kaypacha-tour-btn',
      '#tour-kaypacha-asesor-info',
      '#tour-kaypacha-kpi-cards',
      '#tour-kaypacha-puntos-acumulados',
      '#tour-kaypacha-variables-historicas',
    ]);
  });
});

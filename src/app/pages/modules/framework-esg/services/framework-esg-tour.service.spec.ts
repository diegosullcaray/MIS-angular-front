import { TestBed } from '@angular/core/testing';
import { FrameworkEsgTourService } from './framework-esg-tour.service';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';

describe('FrameworkEsgTourService', () => {
  let service: FrameworkEsgTourService;
  let driverFalso: { createQuickTour: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    driverFalso = { createQuickTour: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: DriverTourService, useValue: driverFalso }],
    });
    service = TestBed.inject(FrameworkEsgTourService);
  });

  it('iniciarTourGuiado() arma los 6 pasos del tour guiado del módulo ESG, en orden', () => {
    service.iniciarTourGuiado();

    expect(driverFalso.createQuickTour).toHaveBeenCalledTimes(1);
    const pasos = driverFalso.createQuickTour.mock.calls[0][0] as Array<{ element: string }>;
    expect(pasos.map((p) => p.element)).toEqual([
      '#tour-esg-header',
      '#tour-esg-usuarios-btn',
      '#tour-esg-tour-btn',
      '#tour-esg-tabs',
      '#tour-esg-portada-tabla',
      '#tour-esg-metricas-tabla',
    ]);
  });
});

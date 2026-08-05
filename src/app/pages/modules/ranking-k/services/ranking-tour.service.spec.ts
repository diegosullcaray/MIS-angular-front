import { TestBed } from '@angular/core/testing';
import { RankingTourService } from './ranking-tour.service';
import { DriverTourService } from '../../../../shared/services/driver-tour.service';

describe('RankingTourService', () => {
  let service: RankingTourService;
  let driverFalso: { createQuickTour: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    driverFalso = { createQuickTour: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: DriverTourService, useValue: driverFalso }],
    });
    service = TestBed.inject(RankingTourService);
  });

  it('iniciarTourGuiado() arma los 5 pasos del tour guiado del módulo, en orden', () => {
    service.iniciarTourGuiado();

    expect(driverFalso.createQuickTour).toHaveBeenCalledTimes(1);
    const pasos = driverFalso.createQuickTour.mock.calls[0][0] as Array<{ element: string }>;
    expect(pasos.map((p) => p.element)).toEqual([
      '#tour-sidebar-panel',
      '#tour-categoria-header',
      '#tour-info-btn',
      '#tour-filtros-btn',
      '#tour-ranking-tabla',
    ]);
  });
});

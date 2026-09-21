import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../../../shared/services/toast.service';
import { CeroCuotasDashboardRevisionComponent } from './dashboard-revision.component';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';
import type { HierarquiaNodo } from '../../../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA } from '../../../../../../../../models/tabla-dinamica.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };


describe('CeroCuotasDashboardRevisionComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      dashboardRevision: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
      topAsesoresDashboardRevision: vi.fn().mockReturnValue(of(TABLA_DINAMICA_VACIA)),
      mapasCalorDashboardRevision: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      imports: [CeroCuotasDashboardRevisionComponent],
      providers: [
        MessageService,
        {
      provide: ToastService,
      useValue: {
        error: vi.fn(),
        exito: vi.fn(),
        advertencia: vi.fn(),
        info: vi.fn(),
      },
    },
        { provide: CeroCuotasNuevasService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(CeroCuotasDashboardRevisionComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

});

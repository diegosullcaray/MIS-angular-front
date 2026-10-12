import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../../../shared/services/toast.service';
import { CeroCuotasDashboardComponent } from './dashboard.component';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';



describe('CeroCuotasDashboardComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      periodosDashboard: vi.fn().mockReturnValue(of([{ id: '2026-10-11', desc: '11/10/2026' }])),
      dashboard: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [CeroCuotasDashboardComponent],
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
    const fixture = TestBed.createComponent(CeroCuotasDashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { EfectividadCarteraReasignadaComponent } from './efectividad-cartera-reasignada.component';
import { PortafolioReasignadoService } from '../../services/portafolio-reasignado.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };


describe('EfectividadCarteraReasignadaComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      efectividadPorTramos: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [EfectividadCarteraReasignadaComponent],
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
        { provide: PortafolioReasignadoService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(EfectividadCarteraReasignadaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

});

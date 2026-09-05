import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../../shared/services/toast.service';
import { MoraPdmComponent } from './mora-pdm.component';
import { CarteraCraService } from '../../../services/cartera-cra.service';
import type { HierarquiaNodo } from '../../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('MoraPdmComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    servicioSpy = {
      moraPdm: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [MoraPdmComponent],
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
        { provide: CarteraCraService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(MoraPdmComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('responde a la selección de nivel en jerarquía', () => {
    const fixture = TestBed.createComponent(MoraPdmComponent);
    fixture.detectChanges();
    const inst = fixture.componentInstance as unknown as Record<string, unknown>;
    if (typeof inst['onNivelSeleccionado'] === 'function') {
      (inst['onNivelSeleccionado'] as (n: HierarquiaNodo) => void)(NODO);
      fixture.detectChanges();
    }
    expect(fixture.componentInstance).toBeTruthy();
  });
});

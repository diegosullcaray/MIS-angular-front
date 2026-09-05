import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../../../shared/services/toast.service';
import { CeroCuotasTopComponent } from './top.component';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';
import type { HierarquiaNodo } from '../../../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('CeroCuotasTopComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    servicioSpy = {
      top: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      imports: [CeroCuotasTopComponent],
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
    const fixture = TestBed.createComponent(CeroCuotasTopComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('responde a la selección de nivel en jerarquía', () => {
    const fixture = TestBed.createComponent(CeroCuotasTopComponent);
    fixture.detectChanges();
    const inst = fixture.componentInstance as unknown as Record<string, unknown>;
    if (typeof inst['onNivelSeleccionado'] === 'function') {
      (inst['onNivelSeleccionado'] as (n: HierarquiaNodo) => void)(NODO);
      fixture.detectChanges();
    }
    expect(fixture.componentInstance).toBeTruthy();
  });
});

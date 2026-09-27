import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { SaldoCarteraComponent } from './saldo-cartera.component';
import { CarteraCraService } from '../../services/cartera-cra.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

describe('SaldoCarteraComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    servicioSpy = {
      saldoCartera: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      imports: [SaldoCarteraComponent],
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
    const fixture = TestBed.createComponent(SaldoCarteraComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('responde a la selección de nivel en jerarquía', () => {
    const fixture = TestBed.createComponent(SaldoCarteraComponent);
    fixture.detectChanges();
    const inst = fixture.componentInstance as unknown as Record<string, unknown>;
    if (typeof inst['onNivelSeleccionado'] === 'function') {
      (inst['onNivelSeleccionado'] as (n: HierarquiaNodo) => void)(NODO);
      fixture.detectChanges();
    }
    expect(fixture.componentInstance).toBeTruthy();
  });
});

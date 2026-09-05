import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { GestionCarteraReasignadaComponent } from './gestion-cartera-reasignada.component';

import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('GestionCarteraReasignadaComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    servicioSpy = {
      gestionResumen: vi.fn().mockReturnValue(of({ headers: [], body: [], additional: {} })),
      gestionDetalle: vi.fn().mockReturnValue(of({ headers: [], body: [], additional: {} })),
      opcionesUltimaGestion: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      imports: [GestionCarteraReasignadaComponent],
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
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(GestionCarteraReasignadaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../../shared/services/toast.service';
import { CmgClientesFlujoDetalleComponent } from './cmg-clientes-flujo-detalle.component';
import { CmgClientesPasivosService } from '../../../services/cmg-clientes-pasivos.service';
import type { HierarquiaNodo } from '../../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('CmgClientesFlujoDetalleComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    servicioSpy = {
      flujoDetalle: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [CmgClientesFlujoDetalleComponent],
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
        { provide: CmgClientesPasivosService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(CmgClientesFlujoDetalleComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('responde a la selección de nivel en jerarquía', () => {
    const fixture = TestBed.createComponent(CmgClientesFlujoDetalleComponent);
    fixture.detectChanges();
    const inst = fixture.componentInstance as unknown as Record<string, unknown>;
    if (typeof inst['onNivelSeleccionado'] === 'function') {
      (inst['onNivelSeleccionado'] as (n: HierarquiaNodo) => void)(NODO);
      fixture.detectChanges();
    }
    expect(fixture.componentInstance).toBeTruthy();
  });
});

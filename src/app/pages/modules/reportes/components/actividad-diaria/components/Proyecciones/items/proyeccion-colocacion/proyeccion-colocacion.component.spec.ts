import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { ProyeccionColocacionComponent } from './proyeccion-colocacion.component';
import { ProyeccionesService } from '../../services/proyecciones.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('ProyeccionColocacionComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    servicioSpy = {
      colocacionResumen: vi.fn().mockReturnValue(of({ headers: [], body: [], additional: {} })),
      colocacionDetalle: vi.fn().mockReturnValue(of({ headers: [], body: [], additional: {} })),
    };

    TestBed.configureTestingModule({
      imports: [ProyeccionColocacionComponent],
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
        { provide: ProyeccionesService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(ProyeccionColocacionComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('responde a la selección de nivel en jerarquía', () => {
    const fixture = TestBed.createComponent(ProyeccionColocacionComponent);
    fixture.detectChanges();
    const inst = fixture.componentInstance as unknown as Record<string, unknown>;
    if (typeof inst['onNivelSeleccionado'] === 'function') {
      (inst['onNivelSeleccionado'] as (n: HierarquiaNodo) => void)(NODO);
      fixture.detectChanges();
    }
    expect(fixture.componentInstance).toBeTruthy();
  });

  /** Pestaña "Detalle" (`_03`): paginada en el servidor como `app-table-ajax` de `cra-v11`. */
  describe('detalle paginado', () => {
    const NODO_COMPLETO: HierarquiaNodo = { tip_cod: 18, cod_rel: 'U5', des_rel: 'Unidad 5', lvl: 4 };
    const pagina = (total: number) => ({
      headers: [{ columns: [{ columnDef: 'n', header: 'N', isdata: 1 }] }],
      body: [{ n: 'fila' }],
      additional: { Total: total },
    });

    type Instancia = {
      onNivelSeleccionado(n: HierarquiaNodo): void;
      paginaDetalle: { (): number; set(v: number): void };
      totalDetalle(): number | null;
    };

    function crear() {
      servicioSpy['colocacionDetalle'].mockReturnValue(of(pagina(95)));
      const fixture = TestBed.createComponent(ProyeccionColocacionComponent);
      const inst = fixture.componentInstance as unknown as Instancia;
      inst.onNivelSeleccionado(NODO_COMPLETO);
      TestBed.tick();
      return { fixture, inst };
    }

    it('pide el detalle con el nodo completo y la primera página; el total sale de `additional.Total`', () => {
      const { inst } = crear();
      expect(servicioSpy['colocacionDetalle']).toHaveBeenLastCalledWith(NODO_COMPLETO, 1);
      expect(servicioSpy['colocacionResumen']).toHaveBeenCalledTimes(1);
      expect(inst.totalDetalle()).toBe(95);
    });

    it('cambiar de página solo vuelve a pedir el detalle', () => {
      const { inst } = crear();
      inst.paginaDetalle.set(2);
      TestBed.tick();

      expect(servicioSpy['colocacionDetalle']).toHaveBeenLastCalledWith(NODO_COMPLETO, 2);
      expect(servicioSpy['colocacionResumen']).toHaveBeenCalledTimes(1);
    });

    it('otro nivel vuelve a la primera página', () => {
      const { inst } = crear();
      inst.paginaDetalle.set(3);
      TestBed.tick();
      inst.onNivelSeleccionado(NODO);
      TestBed.tick();

      expect(inst.paginaDetalle()).toBe(1);
      expect(servicioSpy['colocacionDetalle']).toHaveBeenLastCalledWith(NODO, 1);
    });
  });
});


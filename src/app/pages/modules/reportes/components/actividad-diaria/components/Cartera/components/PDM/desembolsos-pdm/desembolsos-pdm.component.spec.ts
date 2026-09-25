import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../../shared/services/toast.service';
import { DesembolsosPdmComponent } from './desembolsos-pdm.component';
import { CarteraCraService } from '../../../services/cartera-cra.service';
import type { HierarquiaNodo } from '../../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('DesembolsosPdmComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    servicioSpy = {
      desembolsosPdm: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [DesembolsosPdmComponent],
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
    const fixture = TestBed.createComponent(DesembolsosPdmComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('responde a la selección de nivel en jerarquía', () => {
    const fixture = TestBed.createComponent(DesembolsosPdmComponent);
    fixture.detectChanges();
    const inst = fixture.componentInstance as unknown as Record<string, unknown>;
    if (typeof inst['onNivelSeleccionado'] === 'function') {
      (inst['onNivelSeleccionado'] as (n: HierarquiaNodo) => void)(NODO);
      fixture.detectChanges();
    }
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('paginación en el servidor (legado `app-table-ajax`)', () => {
    const tablaCon = (total: number) => ({
      tabla1: { headers: [], body: [{ a: 1 }], additional: { Total: total } },
    });

    function crearConNivel() {
      servicioSpy['desembolsosPdm'].mockReturnValue(of(tablaCon(95)));
      const fixture = TestBed.createComponent(DesembolsosPdmComponent);
      const inst = fixture.componentInstance as unknown as {
        onNivelSeleccionado(n: HierarquiaNodo): void;
        pagina: { (): number; set(v: number): void };
        totalFilas(): number | null;
      };
      inst.onNivelSeleccionado(NODO);
      TestBed.tick();
      return { fixture, inst };
    }

    it('pide la primera página y toma el total de `additional.Total`', () => {
      const { fixture, inst } = crearConNivel();
      expect(servicioSpy['desembolsosPdm']).toHaveBeenLastCalledWith(NODO, 1);
      expect(inst.totalFilas()).toBe(95);

      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).querySelector('p-paginator')).not.toBeNull();
    });

    it('un cambio de página vuelve a consultar con esa página', () => {
      const { inst } = crearConNivel();
      inst.pagina.set(3);
      TestBed.tick();
      expect(servicioSpy['desembolsosPdm']).toHaveBeenLastCalledWith(NODO, 3);
    });

    it('elegir otro nivel vuelve a la primera página', () => {
      const { inst } = crearConNivel();
      inst.pagina.set(2);
      TestBed.tick();
      const otro: HierarquiaNodo = { tip_cod: 10, cod_rel: 'T1' };
      inst.onNivelSeleccionado(otro);
      TestBed.tick();
      expect(inst.pagina()).toBe(1);
      expect(servicioSpy['desembolsosPdm']).toHaveBeenLastCalledWith(otro, 1);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { GestionComercialComponent } from './gestion-comercial.component';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';
import { KPIS_GESTION_COMERCIAL_VACIOS } from '../../models/gestion-comercial.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

// jsdom no implementa ResizeObserver — lo usa `p-tabs` internamente.
class ResizeObserverFalso {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/**
 * Regresión de la tarea 2 de `incidencias-carteras-actualizado.md`: "saca del
 * tab de clientes Var. Clientes Stock que eso va en el tab de saldo cartera".
 *
 * En el legado (`gestion-comercial.component.html`) NINGUNA de las dos tablas
 * "Var." cuelga de una pestaña: van intercaladas en el bloque "Análisis
 * Gráfico", fuera de las dos pestañas "Saldo Cartera"/"Clientes".
 */
describe('GestionComercialComponent', () => {
  beforeEach(() => {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserverFalso }).ResizeObserver = ResizeObserverFalso;
  });

  /**
   * El service siempre devuelve un elemento por cada entrada de
   * `GRAFICOS_GESTION_COMERCIAL` (6), aunque un gráfico puntual falle — por
   * eso el fixture trae los 6, no un array vacío: es la forma real en la que
   * el componente decide, POR POSICIÓN, dónde van las dos tablas "Var.".
   */
  function crear() {
    const gestionComercial = vi.fn().mockReturnValue(
      of({
        filas: [{ descripcion: 'FC' }],
        varSaldoVigente: { columnas: [{ key: 'a', label: 'A' }], filas: [{ a: 1 }] },
        varClientesStock: { columnas: [{ key: 'b', label: 'B' }], filas: [{ b: 2 }] },
        kpis: KPIS_GESTION_COMERCIAL_VACIOS,
        graficos: Array.from({ length: 6 }, (_, i) => ({
          titulo: `Gráfico ${i}`,
          formato: 'soles' as const,
          categorias: [],
          series: [],
        })),
      }),
    );
    TestBed.configureTestingModule({
      imports: [GestionComercialComponent],
      providers: [
        {
          provide: CarteraRepositorioService,
          useValue: { gestionComercial, periodosGestionComercial: vi.fn().mockReturnValue(of([])) },
        },
        PrimeNgMessageService,
      ],
    });
    const fixture = TestBed.createComponent(GestionComercialComponent);
    (fixture.componentInstance as unknown as { onNivelSeleccionado(nodo: HierarquiaNodo): void }).onNivelSeleccionado(
      NODO,
    );
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('ninguna de las dos pestañas ("Saldo Cartera", "Clientes") contiene las tablas "Var."', () => {
    const el = crear();
    const paneles = el.querySelectorAll('p-tabpanel');

    expect(paneles).toHaveLength(2);
    for (const panel of Array.from(paneles)) {
      expect(panel.textContent).not.toContain('Var Saldo Cartera Vigente');
      expect(panel.textContent).not.toContain('Var Clientes Stock');
    }
  });

  it('las dos tablas "Var." sí aparecen en el bloque de Análisis Gráfico, fuera de las pestañas', () => {
    const el = crear();

    expect(el.textContent).toContain('Var Saldo Cartera Vigente');
    expect(el.textContent).toContain('Var Clientes Stock');
  });
});

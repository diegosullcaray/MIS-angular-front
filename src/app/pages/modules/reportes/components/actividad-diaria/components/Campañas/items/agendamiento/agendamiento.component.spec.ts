import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { AgendamientoComponent } from './agendamiento.component';
import { CampanasService } from '../../services/campanas.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

// jsdom no implementa ResizeObserver — lo usa `p-tabs` internamente.
class ResizeObserverFalso {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

/**
 * Regresión del ítem 1 de `docs/09-incidencias/incidencias-campañas.md`:
 * "en este reporte se está trabajando por tabs [...] y cada tab varía la
 * secuencia de filtros, revisa y corrige".
 *
 * El legado (`agenda-comercial.component.ts`, `onTabChanged()`) reparte las
 * cuatro tablas en pestañas y cambia qué filtros se ven según cuál esté
 * activa: "Nivel de Fuga" se oculta en "Detalle Bases Vivas" y ahí aparece en
 * su lugar "Rango de fechas Cancela", que en las otras tres no se ve.
 * "Nivel de propensión" es el único sin ese `*ngIf` y está en las cuatro.
 */
describe('AgendamientoComponent', () => {
  beforeEach(() => {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserverFalso }).ResizeObserver = ResizeObserverFalso;
  });

  function crear() {
    TestBed.configureTestingModule({
      imports: [AgendamientoComponent],
      providers: [
        { provide: CampanasService, useValue: { agendamiento: vi.fn().mockReturnValue(of([])) } },
        PrimeNgMessageService,
      ],
    });
    const fixture = TestBed.createComponent(AgendamientoComponent);
    // Sin nivel elegido el componente pinta el estado vacío: hay que elegir uno
    // para que aparezcan las pestañas, igual que en el resto del reporte.
    (fixture.componentInstance as unknown as { onNivelSeleccionado(nodo: HierarquiaNodo): void }).onNivelSeleccionado(
      NODO,
    );
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('declara las cuatro pestañas del `mat-tab-group` del legado, en su orden', () => {
    const el = crear();
    const etiquetas = Array.from(el.querySelectorAll('p-tab')).map((tab) => tab.textContent?.trim());

    expect(etiquetas).toEqual([
      'Resumen Total',
      'Resumen por Bases',
      'Detalle Bases Vivas',
      'Detalle Bases Automáticos y express',
    ]);
  });

  /** Las cuatro pestañas apuntan a una tabla distinta — no las cuatro apiladas en una sola. */
  function panel(el: HTMLElement, indice: number): HTMLElement {
    const panel = el.querySelectorAll('p-tabpanel')[indice];
    if (!panel) throw new Error(`No se encontró el panel ${indice}`);
    return panel as HTMLElement;
  }

  it.each([
    [0, 'Resumen Total'],
    [1, 'Resumen por Bases'],
  ])('"%s" (panel %i) muestra Nivel de fuga y Nivel de propensión, sin Rango', (indice) => {
    const texto = panel(crear(), indice as number).textContent ?? '';

    expect(texto).toContain('Nivel de fuga');
    expect(texto).toContain('Nivel de propensión');
    expect(texto).not.toContain('Rango de fechas Cancela');
  });

  it('"Detalle Bases Automáticos y express" (panel 3) también lleva Fuga y Propensión, sin Rango', () => {
    const texto = panel(crear(), 3).textContent ?? '';

    expect(texto).toContain('Nivel de fuga');
    expect(texto).toContain('Nivel de propensión');
    expect(texto).not.toContain('Rango de fechas Cancela');
  });

  /**
   * La única pestaña donde el legado invierte la visibilidad: oculta "Nivel de
   * Fuga" y muestra en su lugar "Rango de fechas Cancela".
   */
  it('"Detalle Bases Vivas" (panel 2) oculta Nivel de fuga y muestra Rango en su lugar', () => {
    const texto = panel(crear(), 2).textContent ?? '';

    expect(texto).not.toContain('Nivel de fuga');
    expect(texto).toContain('Nivel de propensión');
    expect(texto).toContain('Rango de fechas Cancela');
  });

  /** Elegir un filtro en cualquier pestaña recarga las cuatro tablas del legado, no solo la activa. */
  it('cualquier cambio de filtro vuelve a pedir las cuatro tablas', () => {
    const agendamiento = vi.fn().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [AgendamientoComponent],
      providers: [{ provide: CampanasService, useValue: { agendamiento } }, PrimeNgMessageService],
    });
    const fixture = TestBed.createComponent(AgendamientoComponent);
    const instancia = fixture.componentInstance as unknown as {
      onNivelSeleccionado(nodo: HierarquiaNodo): void;
      rango: { set(v: number): void };
    };
    instancia.onNivelSeleccionado(NODO);
    fixture.detectChanges();
    agendamiento.mockClear();

    instancia.rango.set(2);
    fixture.detectChanges();

    expect(agendamiento).toHaveBeenCalledTimes(1);
    expect(agendamiento).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC' }, { fuga: 0, prop: 0, rango: 2 });
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { MonitorSalidasRetencionesComponent } from './monitor-salidas-retenciones.component';
import { MonitorSalidasService } from '../../services/monitor-salidas.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

/**
 * Regresión de la tarea 1 de `incidencias-carteras-actualizado.md`: el punto
 * de color seguía "faltando en el kpi Churn rate" después del fix anterior a
 * nivel de datos (`semaforoChurn`/`conSemaforoChurn`). Esta prueba cierra el
 * círculo hasta el DOM real que ve el usuario, no solo la función pura.
 */
describe('MonitorSalidasRetencionesComponent: punto de color de Churn rate', () => {
  function crear(filaTabla: Record<string, unknown>) {
    const resultados = vi.fn().mockReturnValue(
      of({ cards: [], table: [filaTabla] }),
    );
    TestBed.configureTestingModule({
      imports: [MonitorSalidasRetencionesComponent],
      providers: [{ provide: MonitorSalidasService, useValue: { resultados } }, PrimeNgMessageService],
    });
    const fixture = TestBed.createComponent(MonitorSalidasRetencionesComponent);
    (fixture.componentInstance as unknown as { onNivelSeleccionado(nodo: HierarquiaNodo): void }).onNivelSeleccionado(
      NODO,
    );
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('un churn rate bajo (< 90.25 %) pinta el punto en rojo en la tabla del nivel', () => {
    const el = crear({ desc: 'Financiera Confianza', sali1: 10, sali3: 20, ret: 0.85, clive: 5 });

    const punto = el.querySelector('i.pi-circle-fill');
    expect(punto).not.toBeNull();
    expect(punto?.className).toContain('mis-danger');
  });

  it('un churn rate alto (≥ 95 %) pinta el punto en verde', () => {
    const el = crear({ desc: 'Financiera Confianza', sali1: 10, sali3: 20, ret: 0.97, clive: 5 });

    expect(el.querySelector('i.pi-circle-fill')?.className).toContain('mis-success');
  });
});

/** Drill down del legado (`mon-salidas/principal`: `ddEvent` → `ddHier` / `ddCli`). */
describe('MonitorSalidasRetencionesComponent: drill down', () => {
  const TOTAL = { desc: 'Financiera Confianza', tip_cod: 9, cod_rel: 'FC', sali1: 30, sali3: 60, ret: 0.9, clive: 12 };
  const TERRITORIO = { desc: 'Territorio Norte', tip_cod: 20, cod_rel: 'T1', sali1: 10, sali3: 20, ret: 0.97, clive: 4 };
  const ASESOR = { desc: 'Asesor Uno', tip_cod: 1, cod_rel: 'A1', sali1: 1, sali3: 2, ret: 0.8, clive: 0 };

  type Instancia = {
    onNivelSeleccionado(nodo: HierarquiaNodo): void;
    onRutaSeleccionada(ruta: HierarquiaNodo[]): void;
    onCeldaSeleccionada(e: { clave: string; fila: Record<string, unknown> }): void;
    volverANivel(i: number): void;
    columnasClicables(): string[];
    rutaJerarquica(): HierarquiaNodo[];
    metrica(): string | null;
  };

  function crear(filas: Record<string, unknown>[]) {
    const resultados = vi.fn().mockReturnValue(of({ cards: [], table: filas }));
    const detalle = vi.fn().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [MonitorSalidasRetencionesComponent],
      providers: [{ provide: MonitorSalidasService, useValue: { resultados, detalle } }, PrimeNgMessageService],
    });
    const fixture = TestBed.createComponent(MonitorSalidasRetencionesComponent);
    const inst = fixture.componentInstance as unknown as Instancia;
    inst.onRutaSeleccionada([NODO]);
    inst.onNivelSeleccionado(NODO);
    fixture.detectChanges();
    return { fixture, inst, resultados, detalle };
  }

  it('la descripción es clicable solo si alguna fila tiene a dónde bajar', () => {
    expect(crear([TOTAL, TERRITORIO]).inst.columnasClicables()).toContain('desc');
    TestBed.resetTestingModule();
    expect(crear([TOTAL, ASESOR]).inst.columnasClicables()).not.toContain('desc');
  });

  it('clic en la descripción baja a ese nivel y lo agrega a las migas', () => {
    const { inst, resultados } = crear([TOTAL, TERRITORIO]);
    inst.onCeldaSeleccionada({ clave: 'desc', fila: TERRITORIO });

    expect(resultados).toHaveBeenLastCalledWith({ tip_cod: 20, cod_rel: 'T1' });
    expect(inst.rutaJerarquica().map((n) => n.cod_rel)).toEqual(['FC', 'T1']);
  });

  it('no baja desde la fila de totales ni desde un asesor', () => {
    const { inst, resultados } = crear([TOTAL, ASESOR]);
    resultados.mockClear();
    inst.onCeldaSeleccionada({ clave: 'desc', fila: TOTAL });
    inst.onCeldaSeleccionada({ clave: 'desc', fila: ASESOR });
    expect(resultados).not.toHaveBeenCalled();
  });

  it('cada métrica abre su propio listado de clientes; Churn rate no abre nada', () => {
    const { inst, detalle } = crear([TOTAL, TERRITORIO]);

    inst.onCeldaSeleccionada({ clave: 'ret', fila: TERRITORIO });
    expect(inst.metrica()).toBeNull();

    inst.onCeldaSeleccionada({ clave: 'sali3', fila: TERRITORIO });
    TestBed.tick();
    expect(inst.metrica()).toBe('sali3');
    expect(detalle).toHaveBeenLastCalledWith({ tip_cod: 20, cod_rel: 'T1' }, 'sali3', 10);
  });

  it('una miga vuelve a ese nivel y recorta la ruta', () => {
    const { inst, resultados } = crear([TOTAL, TERRITORIO]);
    inst.onCeldaSeleccionada({ clave: 'desc', fila: TERRITORIO });
    inst.volverANivel(0);

    expect(resultados).toHaveBeenLastCalledWith({ tip_cod: 9, cod_rel: 'FC' });
    expect(inst.rutaJerarquica().map((n) => n.cod_rel)).toEqual(['FC']);
  });
});

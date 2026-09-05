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

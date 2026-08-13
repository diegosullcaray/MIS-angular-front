import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { EditarMetricaDialogComponent } from './editar-metrica-dialog.component';
import { FrameworkEsgService } from '../../services/framework-esg.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { EsgMetricaFila } from '../../models/metrica.model';

function fila(overrides: Partial<EsgMetricaFila> = {}): EsgMetricaFila {
  return {
    cod_met: 15,
    cod_cat: 1,
    des_met: 'Consumo de papel',
    des_med: 'Kg',
    des_dis: 'Sí',
    sit_met: 1,
    cfg_met: JSON.stringify({ meta: '100' }),
    '2024-01': '50',
    ...overrides,
  };
}

describe('EditarMetricaDialogComponent', () => {
  let esgFalso: { actualizarMetrica: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    esgFalso = { actualizarMetrica: vi.fn() };
    TestBed.configureTestingModule({
      imports: [EditarMetricaDialogComponent],
      providers: [{ provide: FrameworkEsgService, useValue: esgFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(EditarMetricaDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al recibir una fila, precarga des_dis/sit_met/histórico/atributos', () => {
    const fixture = crear();
    fixture.componentRef.setInput('fila', fila());
    fixture.componentRef.setInput('columnasHistoricas', ['2024-01']);
    fixture.componentRef.setInput('atributos', [{ key: 'meta', label: 'Meta' }]);
    fixture.detectChanges();

    expect(fixture.componentInstance['desDisponible']()).toBe('Sí');
    expect(fixture.componentInstance['situacion']()).toBe(1);
    expect(fixture.componentInstance['historico']()).toEqual({ '2024-01': '50' });
    expect(fixture.componentInstance['atributosValores']()).toEqual({ meta: '100' });
  });

  it('cfg_met inválido no rompe: los atributos quedan undefined', () => {
    const fixture = crear();
    fixture.componentRef.setInput('fila', fila({ cfg_met: '{roto' }));
    fixture.componentRef.setInput('atributos', [{ key: 'meta', label: 'Meta' }]);
    fixture.detectChanges();

    expect(fixture.componentInstance['atributosValores']()).toEqual({ meta: undefined });
  });

  it('titulo() cambia según modoEdicion', () => {
    const fixture = crear();
    fixture.componentRef.setInput('modoEdicion', true);
    fixture.detectChanges();
    expect(fixture.componentInstance['titulo']()).toBe('Editar Metrica ESG');

    fixture.componentRef.setInput('modoEdicion', false);
    fixture.detectChanges();
    expect(fixture.componentInstance['titulo']()).toBe('Detalle Metrica ESG');
  });

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(emitido);

    fixture.componentInstance['cerrar']();

    expect(emitido).toHaveBeenCalledWith(false);
  });

  it('guardar() sin fila no llama al servicio', () => {
    const fixture = crear();
    fixture.componentInstance['guardar']();
    expect(esgFalso.actualizarMetrica).not.toHaveBeenCalled();
  });

  it('guardar() envía el payload armado y, si ok=true, emite guardado y cierra', () => {
    esgFalso.actualizarMetrica.mockReturnValue(of(true));
    const fixture = crear();
    fixture.componentRef.setInput('fila', fila());
    fixture.componentRef.setInput('columnasHistoricas', ['2024-01']);
    fixture.componentRef.setInput('atributos', [{ key: 'meta', label: 'Meta' }]);
    fixture.detectChanges();

    const guardadoSpy = vi.fn();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.guardado.subscribe(guardadoSpy);
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);

    fixture.componentInstance['desDisponible'].set('No');
    fixture.componentInstance['guardar']();

    expect(esgFalso.actualizarMetrica).toHaveBeenCalledWith(15, {
      des_dis: 'No',
      sit_met: 1,
      hist: { '2024-01': '50' },
      cfg_met: { meta: '100' },
    });
    expect(guardadoSpy).toHaveBeenCalled();
    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(fixture.componentInstance['guardando']()).toBe(false);
  });

  it('guardar() con ok=false muestra un toast de error y no cierra', () => {
    esgFalso.actualizarMetrica.mockReturnValue(of(false));
    const fixture = crear();
    fixture.componentRef.setInput('fila', fila());
    fixture.detectChanges();
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);

    fixture.componentInstance['guardar']();

    expect(errorSpy).toHaveBeenCalled();
    expect(visibleChangeSpy).not.toHaveBeenCalled();
  });

  it('guardar() ante un error del backend muestra un toast y apaga el loading', () => {
    esgFalso.actualizarMetrica.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crear();
    fixture.componentRef.setInput('fila', fila());
    fixture.detectChanges();
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['guardar']();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['guardando']()).toBe(false);
  });
});

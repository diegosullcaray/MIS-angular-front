import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CalculadoraDialogComponent } from './calculadora-dialog.component';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { CalculadoraConfig } from '../../models';

function calculadora(overrides: Partial<CalculadoraConfig> = {}): CalculadoraConfig {
  return {
    variables: [
      { id: 'car', des: 'Cartera', icono: 'pi pi-briefcase', formato: 'number', key: 'v_car', bob: 10, bop: 2, met: 100, val: 90, show: true },
      { id: 'efec1', des: 'Efect.', icono: 'pi pi-gauge', formato: 'percent', key: 'v_efec1', bob: 5, bop: 1, met: 0.9, val: 0.8, show: true, tp1: 0.3, tp2: 0.3, tp3: 0.4 },
    ],
    plus: [
      { id: 'tas', des: 'Tasas', icono: 'pi pi-percentage', formato: 'percent', key: 'p_tas', val: 0.02, val1: 0.01, met: 0.015, bos: 3, enab: true, show: true, suma: true },
    ],
    bonoBase: 15,
    bonoPlus: 3,
    bonoSuperPlus: 3,
    bonoTotal: 21,
    activo: 1,
    margenRenovacion: 5,
    claseUsuario: 1,
    ...overrides,
  };
}

describe('CalculadoraDialogComponent', () => {
  let incentivosFalso: { calculadora: ReturnType<typeof signal<CalculadoraConfig>>; simular: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    incentivosFalso = { calculadora: signal(calculadora()), simular: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CalculadoraDialogComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }, MessageService],
    });
  });

  function crear(visible = true) {
    const fixture = TestBed.createComponent(CalculadoraDialogComponent);
    fixture.componentRef.setInput('visible', visible);
    fixture.detectChanges();
    return fixture;
  }

  it('al abrirse (visible=true), precarga valoresEditados desde calculadora(), incluyendo tp1/tp2/tp3 y p_tas2', () => {
    const fixture = crear();

    expect(fixture.componentInstance['valor']('v_car')).toBe(90);
    expect(fixture.componentInstance['valor']('tp1')).toBe(0.3);
    expect(fixture.componentInstance['valor']('tp2')).toBe(0.3);
    expect(fixture.componentInstance['valor']('tp3')).toBe(0.4);
    expect(fixture.componentInstance['valor']('p_tas2')).toBe(0.01);
  });

  it('valorMostrado()/actualizarDesdeInput() convierten ×100/÷100 para campos percent', () => {
    const fixture = crear();

    expect(fixture.componentInstance['valorMostrado']('v_efec1', 'percent')).toBe(80);
    expect(fixture.componentInstance['valorMostrado']('v_car', 'number')).toBe(90);

    fixture.componentInstance['actualizarDesdeInput']('v_efec1', 'percent', 75);
    expect(fixture.componentInstance['valor']('v_efec1')).toBe(0.75);
  });

  it('diffTasaPbs() calcula la diferencia en pbs entre p_tas y p_tas2', () => {
    const fixture = crear();
    // p_tas no está en valoresEditados por defecto (solo item.key='p_tas' de plus, que sí se precarga con item.val=0.02)
    expect(fixture.componentInstance['diffTasaPbs']()).toBe(100); // (0.02 - 0.01) * 10000
  });

  it('simular() con la composición de efec1 sumando 100% llama al servicio', () => {
    incentivosFalso.simular.mockReturnValue(of(true));
    const fixture = crear();

    fixture.componentInstance['simular']();

    expect(incentivosFalso.simular).toHaveBeenCalled();
    expect(fixture.componentInstance['errorComposicion']()).toBe(false);
  });

  it('simular() con composición incompleta muestra el error y no llama al servicio', () => {
    const fixture = crear();
    fixture.componentInstance['actualizarDesdeInput']('tp1', 'percent', 10); // ahora suma 10+30+40=80%

    fixture.componentInstance['simular']();

    expect(fixture.componentInstance['errorComposicion']()).toBe(true);
    expect(incentivosFalso.simular).not.toHaveBeenCalled();
  });

  it('simular() sin variable efec1 visible no valida composición', () => {
    incentivosFalso.calculadora.set(calculadora({ variables: [calculadora().variables[0]] }));
    incentivosFalso.simular.mockReturnValue(of(true));
    const fixture = crear();

    fixture.componentInstance['simular']();

    expect(incentivosFalso.simular).toHaveBeenCalled();
  });

  it('simular() con éxito muestra un toast de éxito', () => {
    incentivosFalso.simular.mockReturnValue(of(true));
    const exitoSpy = vi.spyOn(TestBed.inject(ToastService), 'exito');
    const fixture = crear();

    fixture.componentInstance['simular']();

    expect(exitoSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['simulando']()).toBe(false);
  });

  it('simular() con ok=false muestra un toast de error', () => {
    incentivosFalso.simular.mockReturnValue(of(false));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['simular']();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('simular() ante un error del backend muestra un toast y apaga el loading', () => {
    incentivosFalso.simular.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['simular']();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['simulando']()).toBe(false);
  });

  it('cerrar() emite visibleChange(false)', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(emitido);

    fixture.componentInstance['cerrar']();

    expect(emitido).toHaveBeenCalledWith(false);
  });

  it('formatear() aplica el formato number/percent', () => {
    const fixture = crear();
    expect(fixture.componentInstance['formatear'](0.856, 'percent')).toBe('85.60%');
    expect(fixture.componentInstance['formatear'](12.3, 'number')).toBe('12.30');
  });
});

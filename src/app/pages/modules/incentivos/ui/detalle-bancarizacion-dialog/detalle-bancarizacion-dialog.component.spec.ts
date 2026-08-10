import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DetalleBancarizacionDialogComponent } from './detalle-bancarizacion-dialog.component';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { NivelSeleccionado, ResultadoBancarizacion } from '../../models';

describe('DetalleBancarizacionDialogComponent', () => {
  let incentivosFalso: { nivelActual: ReturnType<typeof signal<NivelSeleccionado | null>>; obtenerBancarizacion: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    incentivosFalso = {
      nivelActual: signal<NivelSeleccionado | null>({ tipCod: 1, codRel: 'BT-001', claUsu: 1 }),
      obtenerBancarizacion: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [DetalleBancarizacionDialogComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(DetalleBancarizacionDialogComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    return fixture;
  }

  it('al abrirse, pide el detalle de bancarización del nivel actual', () => {
    const r: ResultadoBancarizacion = { filas: [{ nom: 'Ana', tf: 1, gen: 1, rur: 0, mig: 0 }], totales: { gen_c: 1, rur_c: 0, mig_c: 0, tot_c: 1, tot_m: 50 } };
    incentivosFalso.obtenerBancarizacion.mockReturnValue(of(r));

    const fixture = crear();

    expect(incentivosFalso.obtenerBancarizacion).toHaveBeenCalledWith(1, 'BT-001');
    expect(fixture.componentInstance['resultado']()).toEqual(r);
  });

  it('claseFila() distingue trasladado(1)/heredado(2)/otro', () => {
    incentivosFalso.obtenerBancarizacion.mockReturnValue(of({ filas: [], totales: null }));
    const fixture = crear();

    expect(fixture.componentInstance['claseFila'](1)).toContain('primary-light');
    expect(fixture.componentInstance['claseFila'](2)).toContain('warning-light');
    expect(fixture.componentInstance['claseFila'](0)).toBe('');
  });

  it('claseIndicador() marca en verde solo cuando el valor es 1', () => {
    incentivosFalso.obtenerBancarizacion.mockReturnValue(of({ filas: [], totales: null }));
    const fixture = crear();

    expect(fixture.componentInstance['claseIndicador'](1)).toContain('success');
    expect(fixture.componentInstance['claseIndicador'](0)).toContain('tertiary');
  });

  it('si falla la carga, muestra un toast de error', () => {
    incentivosFalso.obtenerBancarizacion.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    crear();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('cerrar() emite visibleChange(false)', () => {
    incentivosFalso.obtenerBancarizacion.mockReturnValue(of({ filas: [], totales: null }));
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(emitido);

    fixture.componentInstance['cerrar']();

    expect(emitido).toHaveBeenCalledWith(false);
  });
});

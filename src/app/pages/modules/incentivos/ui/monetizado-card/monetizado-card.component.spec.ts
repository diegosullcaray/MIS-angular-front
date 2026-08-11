import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MonetizadoCardComponent } from './monetizado-card.component';
import { IncentivosService } from '../../services/incentivos.service';
import type { MonetizadoIncentivo } from '../../models';

function monetizado(overrides: Partial<MonetizadoIncentivo> = {}): MonetizadoIncentivo {
  return {
    bonoBase: 100,
    bonoPlus: 20,
    bonoSuperPlus: 30,
    bonoTotal: 150,
    codigoSituacion: 1,
    descripcionSituacion: '(Activado)',
    puedeSimular: true,
    modelo: '2026',
    modeloDescripcion: 'M2026',
    mostrarModelo: false,
    fechasHabilitadas: ['20260101', '20260108', '20260115'],
    ...overrides,
  };
}

describe('MonetizadoCardComponent', () => {
  let incentivosFalso: {
    monetizado: ReturnType<typeof signal<MonetizadoIncentivo>>;
    cargando: ReturnType<typeof signal<boolean>>;
    fechaActual: ReturnType<typeof signal<string>>;
    seleccionarFecha: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    incentivosFalso = {
      monetizado: signal(monetizado()),
      cargando: signal(false),
      fechaActual: signal('20260115'),
      seleccionarFecha: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [MonetizadoCardComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(MonetizadoCardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('fechaSeleccionada() convierte fechaActual (YYYYMMDD) a Date', () => {
    const fixture = crear();
    const fecha = fixture.componentInstance['fechaSeleccionada']() as Date;
    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(0);
    expect(fecha.getDate()).toBe(15);
  });

  it('minDate()/maxDate() son la primera y última fecha habilitada', () => {
    const fixture = crear();
    const min = fixture.componentInstance['minDate']() as Date;
    const max = fixture.componentInstance['maxDate']() as Date;
    expect(min.getDate()).toBe(1);
    expect(max.getDate()).toBe(15);
  });

  it('disabledDates() incluye los días entre minDate/maxDate que no están en fechasHabilitadas', () => {
    const fixture = crear();
    const deshabilitadas = fixture.componentInstance['disabledDates']() as Date[];

    // rango 01→15 de enero = 15 días, menos las 3 habilitadas (01, 08, 15) = 12 deshabilitadas
    expect(deshabilitadas).toHaveLength(12);
    expect(deshabilitadas.some((d) => d.getDate() === 1)).toBe(false);
    expect(deshabilitadas.some((d) => d.getDate() === 8)).toBe(false);
    expect(deshabilitadas.some((d) => d.getDate() === 15)).toBe(false);
    expect(deshabilitadas.some((d) => d.getDate() === 2)).toBe(true);
  });

  it('onCambioFecha() convierte la Date elegida a YYYYMMDD y delega en el servicio', () => {
    const fixture = crear();
    fixture.componentInstance['onCambioFecha'](new Date(2026, 0, 8, 12));
    expect(incentivosFalso.seleccionarFecha).toHaveBeenCalledWith('20260108');
  });

  it('onCambioFecha() ignora un valor nulo (el usuario limpió el campo)', () => {
    const fixture = crear();
    fixture.componentInstance['onCambioFecha'](null);
    expect(incentivosFalso.seleccionarFecha).not.toHaveBeenCalled();
  });

  it('claseBonoSuperPlus() marca en rojo cuando el bono es negativo', () => {
    incentivosFalso.monetizado.set(monetizado({ bonoSuperPlus: -10 }));
    const fixture = crear();
    expect(fixture.componentInstance['claseBonoSuperPlus']()).toContain('danger');
  });

  it('claseBonoSuperPlus() no marca nada cuando el bono es positivo', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseBonoSuperPlus']()).toBe('');
  });

  it('claseSituacion() usa color de éxito cuando codigoSituacion=1 y de error en cualquier otro caso', () => {
    const fixture = crear();
    expect(fixture.componentInstance['claseSituacion']()).toContain('success');

    incentivosFalso.monetizado.set(monetizado({ codigoSituacion: 0 }));
    expect(fixture.componentInstance['claseSituacion']()).toContain('danger');
  });

  it('abrirCalculadora emite al hacer clic en el botón de calculadora', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.abrirCalculadora.subscribe(emitido);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.pi-calculator')?.click();

    expect(emitido).toHaveBeenCalled();
  });

  it('no muestra el botón de calculadora si puedeSimular es false', () => {
    incentivosFalso.monetizado.set(monetizado({ puedeSimular: false }));
    const fixture = crear();

    expect((fixture.nativeElement as HTMLElement).querySelector('.pi-calculator')).toBeNull();
  });
});

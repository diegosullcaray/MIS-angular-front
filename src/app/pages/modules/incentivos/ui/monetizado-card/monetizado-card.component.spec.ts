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
    fechasHabilitadas: [],
    ...overrides,
  };
}

describe('MonetizadoCardComponent', () => {
  let incentivosFalso: { monetizado: ReturnType<typeof signal<MonetizadoIncentivo>>; cargando: ReturnType<typeof signal<boolean>>; fechaCorte: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    incentivosFalso = {
      monetizado: signal(monetizado()),
      cargando: signal(false),
      fechaCorte: vi.fn().mockReturnValue('20260115'),
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

  it('fechaCorteFormateada() convierte YYYYMMDD a YYYY-MM-DD', () => {
    const fixture = crear();
    expect(fixture.componentInstance['fechaCorteFormateada']()).toBe('2026-01-15');
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

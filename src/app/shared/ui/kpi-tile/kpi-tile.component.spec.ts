import { TestBed } from '@angular/core/testing';
import { KpiTileComponent } from './kpi-tile.component';

describe('KpiTileComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [KpiTileComponent] });
  });

  function crear(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(KpiTileComponent);
    fixture.componentRef.setInput('etiqueta', 'Ahorros');
    fixture.componentRef.setInput('valor', 0);
    for (const [clave, valor] of Object.entries(inputs)) fixture.componentRef.setInput(clave, valor);
    fixture.detectChanges();
    return fixture;
  }

  it('abrevia los millones y los miles, y deja enteros los valores chicos', () => {
    expect(crear({ valor: 4_235_891 }).componentInstance['valorCompacto']()).toBe('4.2 M');
    expect(crear({ valor: 12_900 }).componentInstance['valorCompacto']()).toBe('12.9 K');
    expect(crear({ valor: 1_284 }).componentInstance['valorCompacto']()).toBe('1,284');
  });

  it('la variación lleva signo explícito, para que se lea como delta y no como total', () => {
    expect(crear({ variacion: 1500 }).componentInstance['variacionConSigno']()).toBe('+1,500');
    expect(crear({ variacion: -1500 }).componentInstance['variacionConSigno']()).toBe('−1,500');
    expect(crear({ variacion: 0 }).componentInstance['variacionConSigno']()).toBe('0');
  });

  it('sin variación no se dibuja la línea del delta', () => {
    const fixture = crear({ variacion: null });
    expect(fixture.componentInstance['variacionConSigno']()).toBe('');
    expect(fixture.nativeElement.querySelector('.pi')).toBeNull();
  });

  it('el color del delta depende de si el movimiento es favorable, no de si sube', () => {
    expect(crear({ variacion: 100 }).componentInstance['claseVariacion']()).toContain('success');
    expect(crear({ variacion: -100 }).componentInstance['claseVariacion']()).toContain('danger');

    // En una métrica donde subir es malo (mora), se invierte.
    expect(crear({ variacion: 100, subirEsBueno: false }).componentInstance['claseVariacion']()).toContain('danger');
    expect(crear({ variacion: -100, subirEsBueno: false }).componentInstance['claseVariacion']()).toContain('success');
  });

  it('el estado no viaja solo en el color: siempre hay una flecha', () => {
    expect(crear({ variacion: 100 }).componentInstance['iconoVariacion']()).toBe('pi-arrow-up-right');
    expect(crear({ variacion: -100 }).componentInstance['iconoVariacion']()).toBe('pi-arrow-down-right');
    expect(crear({ variacion: 0 }).componentInstance['iconoVariacion']()).toBe('pi-minus');
  });

  it('nombra el periodo con el que compara', () => {
    const fixture = crear({ variacion: 100, periodo: 'vs. mes anterior' });
    expect(fixture.nativeElement.textContent).toContain('vs. mes anterior');
  });
});

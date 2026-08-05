import { TestBed } from '@angular/core/testing';
import { ResultadoTableComponent } from './resultado-table.component';

describe('ResultadoTableComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ResultadoTableComponent] });
  });

  it('renderiza una columna de header por cada definición de columnas', () => {
    const fixture = TestBed.createComponent(ResultadoTableComponent);
    fixture.componentRef.setInput('columnas', [
      { label: 'Cuenta', key: 'HCTACLI' },
      { label: 'Nombre', key: 'HDESCLI' },
    ]);
    fixture.componentRef.setInput('filas', [{ HCTACLI: 'C-001', HDESCLI: 'Juan Pérez' }]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('th').length).toBe(2);
    expect(el.textContent).toContain('Cuenta');
    expect(el.textContent).toContain('Juan Pérez');
  });

  it('muestra el mensaje de "sin resultados" cuando no hay filas', () => {
    const fixture = TestBed.createComponent(ResultadoTableComponent);
    fixture.componentRef.setInput('columnas', [{ label: 'Cuenta', key: 'HCTACLI' }]);
    fixture.componentRef.setInput('filas', []);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin resultados para este cliente.');
  });

  it('en modo cargando, muestra el esqueleto en vez de la tabla', () => {
    const fixture = TestBed.createComponent(ResultadoTableComponent);
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('table')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { LoadSpinnerComponent } from './load-spinner.component';

describe('LoadSpinnerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LoadSpinnerComponent] });
  });

  it('muestra el mensaje por defecto', () => {
    const fixture = TestBed.createComponent(LoadSpinnerComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Preparando tu espacio de trabajo…');
  });

  it('muestra un mensaje personalizado cuando se pasa por input', () => {
    const fixture = TestBed.createComponent(LoadSpinnerComponent);
    fixture.componentRef.setInput('mensaje', 'Verificando tu sesión…');
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Verificando tu sesión…');
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccessDeniedComponent } from './access-denied.component';

describe('AccessDeniedComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AccessDeniedComponent],
      providers: [provideRouter([])],
    });
  });

  it('muestra el mensaje por defecto cuando no se pasa uno propio', () => {
    const fixture = TestBed.createComponent(AccessDeniedComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No tienes permisos para acceder a esta sección.');
  });

  it('muestra el mensaje personalizado cuando se pasa por input', () => {
    const fixture = TestBed.createComponent(AccessDeniedComponent);
    fixture.componentRef.setInput('mensaje', 'Necesitas el rol de Supervisor.');
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Necesitas el rol de Supervisor.');
  });

  it('enlaza el botón de retorno a /app/dashboard', () => {
    const fixture = TestBed.createComponent(AccessDeniedComponent);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.getAttribute('href')).toBe('/app/dashboard');
  });
});

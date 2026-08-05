import { TestBed } from '@angular/core/testing';
import { InlineErrorComponent } from './inline-error.component';

describe('InlineErrorComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [InlineErrorComponent] });
  });

  it('usa el título por defecto "Error al cargar datos"', () => {
    const fixture = TestBed.createComponent(InlineErrorComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Error al cargar datos');
  });

  it('muestra el detalle solo cuando se pasa por input', () => {
    const fixture = TestBed.createComponent(InlineErrorComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('No se pudo cargar');

    fixture.componentRef.setInput('detalle', 'No se pudo cargar el detalle de esta categoría.');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudo cargar el detalle de esta categoría.');
  });

  it('muestra "Reintentar" como accionLabel por defecto y emite reintentar al hacer clic', () => {
    const fixture = TestBed.createComponent(InlineErrorComponent);
    fixture.detectChanges();

    let emitido = false;
    fixture.componentInstance.reintentar.subscribe(() => (emitido = true));

    const boton = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(boton.textContent?.trim()).toBe('Reintentar');
    boton.click();

    expect(emitido).toBe(true);
  });

  it('tiene role="alert" para accesibilidad', () => {
    const fixture = TestBed.createComponent(InlineErrorComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
  });
});

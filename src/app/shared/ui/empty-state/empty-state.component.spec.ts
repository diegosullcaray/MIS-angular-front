import { TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmptyStateComponent] });
  });

  it('usa el título por defecto "Sin resultados" cuando no se pasa uno propio', () => {
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('h4')?.textContent).toBe('Sin resultados');
  });

  it('muestra la descripción solo cuando se pasa por input', () => {
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('p')).toBeNull();

    fixture.componentRef.setInput('descripcion', 'No hay categorías disponibles.');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('p')?.textContent).toBe('No hay categorías disponibles.');
  });

  it('no muestra el botón de acción si no se pasa accionLabel', () => {
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('emite el evento accion al hacer clic en el botón', () => {
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('accionLabel', 'Reintentar');
    fixture.detectChanges();

    let emitido = false;
    fixture.componentInstance.accion.subscribe(() => (emitido = true));

    const boton = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(boton.textContent?.trim()).toBe('Reintentar');
    boton.click();

    expect(emitido).toBe(true);
  });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WindowPanelComponent } from './window-panel.component';

@Component({ template: '', standalone: true })
class BlankComponent {}

describe('WindowPanelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WindowPanelComponent],
      providers: [provideRouter([{ path: '**', component: BlankComponent }])],
    });
  });

  function crear(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(WindowPanelComponent);
    for (const [clave, valor] of Object.entries(inputs)) {
      fixture.componentRef.setInput(clave, valor);
    }
    fixture.detectChanges();
    return fixture;
  }

  function elemento(fixture: ReturnType<typeof crear>, selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it('muestra el título y el botón de actualizar en la esquina', () => {
    const fixture = crear({ titulo: 'Kaypacha' });

    expect(elemento(fixture, '.mis-window-titulo')?.textContent?.trim()).toBe('Kaypacha');
    expect(elemento(fixture, '.mis-window-btn--esquina')).not.toBeNull();
  });

  it('emite `actualizar` al pulsar el botón de la esquina', () => {
    const fixture = crear();
    const emitido = vi.fn();
    fixture.componentInstance.actualizar.subscribe(emitido);

    elemento(fixture, '.mis-window-btn--esquina')!.click();

    expect(emitido).toHaveBeenCalled();
  });

  it('no emite `actualizar` mientras la recarga está en curso', () => {
    const fixture = crear({ actualizando: true });
    const emitido = vi.fn();
    fixture.componentInstance.actualizar.subscribe(emitido);

    elemento(fixture, '.mis-window-btn--esquina')!.click();

    expect(emitido).not.toHaveBeenCalled();
  });

  it('oculta el botón de la esquina cuando el módulo no permite actualizar', () => {
    const fixture = crear({ permitirActualizar: false });

    expect(elemento(fixture, '.mis-window-btn--esquina')).toBeNull();
  });

  it('la luz amarilla colapsa el cuerpo sin quitarlo del DOM', () => {
    const fixture = crear();
    const cuerpo = elemento(fixture, '.mis-window-body')!;

    elemento(fixture, '.mis-window-light--minimizar')!.click();
    fixture.detectChanges();

    // Sigue siendo el mismo nodo: minimizar no puede perder el estado del
    // contenido proyectado (scroll, filtros, tablas ya cargadas).
    expect(elemento(fixture, '.mis-window-body')).toBe(cuerpo);
    expect(cuerpo.classList.contains('mis-window-body--oculto')).toBe(true);
  });

  it('la luz roja navega a la ruta de cierre y avisa al módulo', () => {
    const fixture = crear({ rutaAlCerrar: '/app/dashboard' });
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const emitido = vi.fn();
    fixture.componentInstance.cerrar.subscribe(emitido);

    elemento(fixture, '.mis-window-light--cerrar')!.click();

    expect(emitido).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/app/dashboard');
  });

  it('con `rutaAlCerrar` vacía deja el cierre en manos del módulo', () => {
    const fixture = crear({ rutaAlCerrar: '' });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');

    elemento(fixture, '.mis-window-light--cerrar')!.click();

    expect(navegar).not.toHaveBeenCalled();
  });

  it('puede ocultar el semáforo en paneles anidados', () => {
    const fixture = crear({ mostrarSemaforo: false });

    expect(elemento(fixture, '.mis-window-light')).toBeNull();
  });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WindowPanelComponent } from './window-panel.component';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({ template: '', standalone: true })
class BlankComponent {}

describe('WindowPanelComponent', () => {
  let shell: ShellStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WindowPanelComponent],
      providers: [provideRouter([{ path: '**', component: BlankComponent }])],
    });
    shell = TestBed.inject(ShellStateService);
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

  it('el título va sin ícono ni logo', () => {
    const fixture = crear({ titulo: 'Kaypacha', subtitulo: 'Plataforma de desempeño' });
    const barra = elemento(fixture, '.mis-window-bar')!;

    expect(barra.querySelector('img')).toBeNull();
    expect(barra.querySelector('.mis-window-title i')).toBeNull();
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

  it('la luz roja vuelve al inicio del shell', () => {
    const fixture = crear();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const emitido = vi.fn();
    fixture.componentInstance.cerrar.subscribe(emitido);

    elemento(fixture, '.mis-window-light--cerrar')!.click();

    expect(emitido).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/app/dashboard');
  });

  it('la luz amarilla deja el panel neutro con el menú lateral abierto, sin navegar', () => {
    const fixture = crear();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    shell.setNavPanelColapsado(true);
    const emitido = vi.fn();
    fixture.componentInstance.minimizar.subscribe(emitido);

    elemento(fixture, '.mis-window-light--minimizar')!.click();

    expect(emitido).toHaveBeenCalled();
    expect(shell.contenidoPendienteSeleccion()).toBe(true);
    expect(shell.navPanelColapsado()).toBe(false);
    // La ruta no cambia: el contenido sigue montado y vuelve al elegir opción.
    expect(navegar).not.toHaveBeenCalled();
  });

  it('puede ocultar el semáforo en paneles anidados', () => {
    const fixture = crear({ mostrarSemaforo: false });

    expect(elemento(fixture, '.mis-window-light')).toBeNull();
  });
});

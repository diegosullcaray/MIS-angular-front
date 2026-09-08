import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
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

  it('la luz amarilla navega al destino que fija la pantalla', () => {
    const fixture = crear({ volverA: '/app/analista/listas' });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const emitido = vi.fn();
    fixture.componentInstance.volver.subscribe(emitido);

    elemento(fixture, '.mis-window-light--volver')!.click();

    expect(emitido).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/app/analista/listas');
  });

  /** Sin `volverA` ni explorador, la navegación es un paso atrás en el historial. */
  it('sin destino fijo, la luz amarilla retrocede en el historial', () => {
    const fixture = crear();
    const atras = vi.spyOn(TestBed.inject(Location), 'back');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');

    elemento(fixture, '.mis-window-light--volver')!.click();

    expect(atras).toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });

  /**
   * Regresión de la incidencia: el explorador del sistema no es una ruta, así
   * que abrir un reporte desde ahí deja UNA entrada de historial. Retroceder
   * sacaba al usuario del sistema entero y lo dejaba en el Home.
   */
  it('con explorador disponible, la luz amarilla vuelve a él y no al historial', () => {
    shell.setExploradorDisponible(true);
    const fixture = crear();
    const atras = vi.spyOn(TestBed.inject(Location), 'back');

    elemento(fixture, '.mis-window-light--volver')!.click();

    expect(shell.contenidoPendienteSeleccion()).toBe(true);
    expect(atras).not.toHaveBeenCalled();
  });

  it('con el explorador ya a la vista, la luz amarilla sí retrocede', () => {
    shell.setExploradorDisponible(true);
    shell.setContenidoPendienteSeleccion(true);
    const fixture = crear();
    const atras = vi.spyOn(TestBed.inject(Location), 'back');

    elemento(fixture, '.mis-window-light--volver')!.click();

    expect(atras).toHaveBeenCalled();
  });

  it('`volverA` manda sobre el explorador', () => {
    shell.setExploradorDisponible(true);
    const fixture = crear({ volverA: '/app/analista/listas' });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    elemento(fixture, '.mis-window-light--volver')!.click();

    expect(navegar).toHaveBeenCalledWith('/app/analista/listas');
    expect(shell.contenidoPendienteSeleccion()).toBe(false);
  });

  it('puede ocultar el semáforo en paneles anidados', () => {
    const fixture = crear({ mostrarSemaforo: false });

    expect(elemento(fixture, '.mis-window-light')).toBeNull();
  });
});

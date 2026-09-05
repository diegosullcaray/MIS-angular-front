import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { ShellLayoutComponent } from './shell-layout.component';

@Component({ selector: 'app-sidebar', standalone: true, template: '' })
class StubSidebarComponent {}
@Component({ selector: 'app-header', standalone: true, template: '' })
class StubHeaderComponent {}
@Component({ selector: 'app-redirect-overlay', standalone: true, template: '' })
class StubRedirectOverlayComponent {}
@Component({ selector: 'app-loading-overlay', standalone: true, template: '' })
class StubLoadingOverlayComponent {}
@Component({ selector: 'app-explorador-sistema', standalone: true, template: '' })
class StubExploradorSistemaComponent {}
@Component({ selector: 'app-anuncios-dialog', standalone: true, template: '' })
class StubAnunciosDialogComponent {}

/**
 * Contrato responsive del shell.
 *
 * Igual que en el header: acá se verifican las clases, y la medición real está
 * en `e2e/responsive-movil.spec.ts`. Lo que se protege es la reserva inferior
 * —sin ella la barra fija de móvil tapa la última fila de cada reporte— y que
 * el contenido pueda encogerse en vez de empujar la página.
 */
describe('ShellLayoutComponent — contrato responsive', () => {
  function crear(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
      providers: [provideRouter([])],
    }).overrideComponent(ShellLayoutComponent, {
      set: {
        imports: [
          RouterOutlet,
          StubHeaderComponent,
          StubSidebarComponent,
          StubRedirectOverlayComponent,
          StubLoadingOverlayComponent,
          StubExploradorSistemaComponent,
          StubAnunciosDialogComponent,
        ],
      },
    });
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('reserva espacio abajo en móvil para la barra fija, y no en escritorio', () => {
    const el = crear();
    const columna = el.querySelector('.shell-wallpaper > div') as HTMLElement;

    expect(columna).not.toBeNull();
    expect(columna.className).toContain('pb-16');
    expect(columna.className).toContain('sm:pb-0');
  });

  it('la columna de contenido puede encogerse (`min-w-0`) en vez de empujar la página', () => {
    // Sin `min-w-0` un hijo ancho —una tabla de reporte— estira el flex y saca
    // scroll horizontal a TODA la pantalla, no solo a la tabla.
    const el = crear();
    const columna = el.querySelector('.shell-wallpaper > div') as HTMLElement;
    expect(columna.className).toContain('min-w-0');
  });

  it('el área principal desplaza en vertical y nunca en horizontal', () => {
    const el = crear();
    const main = el.querySelector('main') as HTMLElement;

    expect(main.className).toContain('overflow-y-auto');
    expect(main.className).not.toContain('overflow-x-auto');
  });

  it('el fondo del shell cubre la pantalla sin desbordarla', () => {
    const el = crear();
    const raiz = el.firstElementChild as HTMLElement;

    expect(raiz.className).toContain('h-screen');
    expect(raiz.className).toContain('overflow-hidden');
  });
});

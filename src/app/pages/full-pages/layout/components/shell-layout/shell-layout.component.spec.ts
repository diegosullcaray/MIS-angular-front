import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { ShellLayoutComponent } from './shell-layout.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';

/**
 * `ShellLayoutComponent` es puramente de composición (sin lógica propia):
 * arma el layout de Sidebar + Header + `<router-outlet>` + overlay de
 * redirección. Se reemplazan los hijos reales (que dependen de servicios
 * pesados — MenuStgService, AuthService, etc.) por stubs con el mismo
 * selector, para verificar solo que el layout los compone correctamente.
 */
@Component({ selector: 'app-sidebar', standalone: true, template: '' })
class StubSidebarComponent {}

@Component({ selector: 'app-header', standalone: true, template: '' })
class StubHeaderComponent {}

@Component({ selector: 'app-redirect-overlay', standalone: true, template: '' })
class StubRedirectOverlayComponent {}

@Component({ selector: 'app-loading-overlay', standalone: true, template: '' })
class StubLoadingOverlayComponent {}

@Component({ selector: 'app-explorador-sistema', standalone: true, template: '<div class="stub-explorador"></div>' })
class StubExploradorSistemaComponent {}

@Component({ selector: 'app-anuncios-dialog', standalone: true, template: '' })
class StubAnunciosDialogComponent {}

describe('ShellLayoutComponent', () => {
  beforeEach(() => {
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
  });

  it('renderiza el sidebar, el header, el router-outlet y el overlay de redirección', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-sidebar')).not.toBeNull();
    expect(el.querySelector('app-header')).not.toBeNull();
    expect(el.querySelector('app-redirect-overlay')).not.toBeNull();
  });

  it('deja el wallpaper en manos del tema (`--mis-wallpaper`), no de utilidades fijas', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.detectChanges();

    const raiz = (fixture.nativeElement as HTMLElement).firstElementChild as HTMLElement;
    // Qué foto toca (mobile / escritorio / escritorio oscuro) lo resuelve
    // `tokens.css`; acá solo queda cómo se dibuja.
    expect(raiz.className).toContain('shell-wallpaper');
    expect(raiz.className).toContain('bg-cover');
    expect(raiz.className).not.toContain('bg-[url(');
  });

  it('mientras contenidoPendienteSeleccion está activo, oculta el router-outlet (contenido del sistema anterior) y muestra el explorador del sistema', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    const shell = TestBed.inject(ShellStateService);
    shell.setContenidoPendienteSeleccion(true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-explorador-sistema')).not.toBeNull();
    expect(el.querySelector('.shell-content-inner')?.classList.contains('hidden')).toBe(true);
  });

  it('sin contenidoPendienteSeleccion, no muestra el explorador y deja visible el router-outlet', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-explorador-sistema')).toBeNull();
    expect(el.querySelector('.shell-content-inner')?.classList.contains('hidden')).toBe(false);
  });
});

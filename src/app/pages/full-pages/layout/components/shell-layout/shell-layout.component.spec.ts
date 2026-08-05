import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { ShellLayoutComponent } from './shell-layout.component';

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

describe('ShellLayoutComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
      providers: [provideRouter([])],
    }).overrideComponent(ShellLayoutComponent, {
      set: { imports: [RouterOutlet, StubHeaderComponent, StubSidebarComponent, StubRedirectOverlayComponent] },
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

  it('usa el wallpaper de mobile (wallpaper_cell.png) por defecto, y el de escritorio (wallpaper.png) desde sm:', () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.detectChanges();

    const raiz = (fixture.nativeElement as HTMLElement).firstElementChild as HTMLElement;
    expect(raiz.className).toContain("bg-[url('/assets/images/fc/fondos/wallpaper_cell.png')]");
    expect(raiz.className).toContain("sm:bg-[url('/assets/images/fc/fondos/wallpaper.png')]");
  });
});

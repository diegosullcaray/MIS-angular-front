import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { HeaderComponent } from './header.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { AuthService } from '../../../auth/service/auth.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';
import type { SidebarIcon } from '../../interfaces/sidebar.model';

@Component({ template: '', standalone: true })
class BlankComponent {}

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: [],
    ...overrides,
  };
}

describe('HeaderComponent', () => {
  let shell: ShellStateService;
  let router: Router;
  let authFalso: { cerrarSesion: ReturnType<typeof vi.fn> };
  let menuStgFalso: { sistemas: ReturnType<typeof signal<SidebarIcon[]>>; buscarPorRuta: ReturnType<typeof vi.fn> };
  let kaypachaFalso: { buscarCategoria: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authFalso = { cerrarSesion: vi.fn() };
    menuStgFalso = { sistemas: signal<SidebarIcon[]>([]), buscarPorRuta: vi.fn().mockReturnValue(null) };
    kaypachaFalso = { buscarCategoria: vi.fn().mockReturnValue(undefined) };

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([{ path: '**', component: BlankComponent }]),
        { provide: AuthService, useValue: authFalso },
        { provide: MenuStgService, useValue: menuStgFalso },
        { provide: KaypachaService, useValue: kaypachaFalso },
      ],
    });
    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function crear(url: string) {
    await router.navigateByUrl(url);
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('no muestra breadcrumb fuera de las rutas del shell (/app/...)', async () => {
    const fixture = await crear('/login');
    expect(fixture.componentInstance['breadcrumbItems']()).toEqual([]);
  });

  it('breadcrumb de una ruta simple del Host (/app/dashboard)', async () => {
    const fixture = await crear('/app/dashboard');
    expect(fixture.componentInstance['breadcrumbItems']()).toEqual([{ label: 'Mi espacio' }]);
  });

  it('breadcrumb de categoria-detalle usa el nombre real de la categoría (KaypachaService)', async () => {
    kaypachaFalso.buscarCategoria.mockReturnValue({ name: 'Zona Norte', reportType: 'Medal', rdestip: 'cat-1' });

    const fixture = await crear('/app/ranking-k/categoria/cat-1');

    expect(fixture.componentInstance['breadcrumbItems']()).toEqual([
      { label: 'Ranking Kaypacha', routerLink: '/app/ranking-k' },
      { label: 'Categoría', routerLink: '/app/ranking-k/categoria' },
      { label: 'Zona Norte' },
    ]);
  });

  it('breadcrumb de categoria-detalle cae a "Detalle" si la categoría todavía no cargó', async () => {
    kaypachaFalso.buscarCategoria.mockReturnValue(undefined);

    const fixture = await crear('/app/ranking-k/categoria/cat-1');

    const items = fixture.componentInstance['breadcrumbItems']();
    expect(items[items.length - 1]).toEqual({ label: 'Detalle' });
  });

  it('breadcrumb de un sistema remoto de STG usa el árbol de MenuStgService cuando lo encuentra', async () => {
    menuStgFalso.buscarPorRuta.mockReturnValue({ sistemaId: 'sist-1', etiquetas: ['Clientes', 'CMG Clientes Flujo'] });
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Actividad Mensual', tienePanel: true }]);

    const fixture = await crear('/app/actividad-mensual/clientes/cmg');

    expect(fixture.componentInstance['breadcrumbItems']()).toEqual([
      { label: 'Actividad Mensual' },
      { label: 'Clientes' },
      { label: 'CMG Clientes Flujo' },
    ]);
  });

  it('breadcrumb de un sistema remoto cae a un fallback legible si el árbol de STG aún no encontró la hoja', async () => {
    menuStgFalso.buscarPorRuta.mockReturnValue(null);

    const fixture = await crear('/app/subsistema-reportes-operativos/algo');

    expect(fixture.componentInstance['breadcrumbItems']()).toEqual([
      { label: 'Reportes operativos' },
      { label: 'Algo' },
    ]);
  });

  it('rolLabel traduce el rol del usuario activo a su etiqueta legible', async () => {
    shell.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));
    const fixture = await crear('/app/dashboard');

    expect(fixture.componentInstance['rolLabel']()).toBe('Supervisor');
  });

  it('rolLabel es vacío sin usuario activo', async () => {
    const fixture = await crear('/app/dashboard');
    expect(fixture.componentInstance['rolLabel']()).toBe('');
  });

  it('toggleDropdown() alterna dropdownOpen', async () => {
    const fixture = await crear('/app/dashboard');
    const instancia = fixture.componentInstance;

    expect(instancia['dropdownOpen']()).toBe(false);
    instancia['toggleDropdown']();
    expect(instancia['dropdownOpen']()).toBe(true);
    instancia['toggleDropdown']();
    expect(instancia['dropdownOpen']()).toBe(false);
  });

  it('pedirConfirmacionSalir() cierra el dropdown y abre el diálogo de confirmación', async () => {
    const fixture = await crear('/app/dashboard');
    const instancia = fixture.componentInstance;
    instancia['toggleDropdown'](); // lo abre primero

    instancia['pedirConfirmacionSalir']();

    expect(instancia['dropdownOpen']()).toBe(false);
    expect(instancia['confirmarSalirOpen']()).toBe(true);
  });

  it('confirmarCerrarSesion() marca cerrandoSesion de inmediato y cierra sesión tras 5s', async () => {
    vi.useFakeTimers();
    const fixture = await crear('/app/dashboard');
    const instancia = fixture.componentInstance;
    instancia['confirmarSalirOpen'].set(true);

    const promesa = instancia['confirmarCerrarSesion']();

    expect(instancia['confirmarSalirOpen']()).toBe(false);
    expect(shell.cerrandoSesion()).toBe(true);
    expect(authFalso.cerrarSesion).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);
    await promesa;

    expect(authFalso.cerrarSesion).toHaveBeenCalled();
  });

  it('muestra el botón de alternar el panel (mobile) cuando el sistema activo tiene panel propio', async () => {
    shell.setSidebarTienePanel(true);
    const fixture = await crear('/app/dashboard');

    expect((fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Alternar menú lateral"]')).not.toBeNull();
  });

  it('oculta el botón de alternar el panel cuando el sistema activo no tiene panel propio', async () => {
    shell.setSidebarTienePanel(false);
    const fixture = await crear('/app/dashboard');

    expect((fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Alternar menú lateral"]')).toBeNull();
  });
});

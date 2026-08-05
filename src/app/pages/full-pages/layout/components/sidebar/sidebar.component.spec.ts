import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { SidebarComponent } from './sidebar.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavRuta } from '../../interfaces/sidebar.model';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';

const RUTA_RANKING_K = '/app/ranking-k';

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

describe('SidebarComponent', () => {
  let shell: ShellStateService;
  let router: Router;
  let menuStgFalso: {
    sistemas: ReturnType<typeof signal<SidebarIcon[]>>;
    hijosPorSistema: ReturnType<typeof signal<Record<string, SidebarNavRuta[]>>>;
    cargar: ReturnType<typeof vi.fn>;
  };
  let kaypachaFalso: { ruta: string; panelPara: ReturnType<typeof vi.fn>; cargarCategorias: ReturnType<typeof vi.fn> };
  let redirectFalso: { redirigir: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    menuStgFalso = {
      sistemas: signal<SidebarIcon[]>([]),
      hijosPorSistema: signal<Record<string, SidebarNavRuta[]>>({}),
      cargar: vi.fn(),
    };
    kaypachaFalso = {
      ruta: RUTA_RANKING_K,
      panelPara: vi.fn().mockReturnValue({ tipo: 'host-admin', titulo: 'Ranking Kaypacha', icono: 'pi', secciones: [] } as SidebarNavPanelConfig),
      cargarCategorias: vi.fn(),
    };
    redirectFalso = { redirigir: vi.fn() };

    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: MenuStgService, useValue: menuStgFalso },
        { provide: KaypachaService, useValue: kaypachaFalso },
        { provide: RedirectOverlayService, useValue: redirectFalso },
      ],
    });
    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
  });

  function crear() {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga las categorías de ranking-k al construirse', () => {
    crear();
    expect(kaypachaFalso.cargarCategorias).toHaveBeenCalled();
  });

  it('ngOnInit carga el menú STG solo si hay un usuario activo con email', () => {
    crear();
    expect(menuStgFalso.cargar).not.toHaveBeenCalled();
  });

  it('ngOnInit carga el menú STG con el email del usuario activo', () => {
    shell.setUsuarioActivo(usuario());
    crear();
    expect(menuStgFalso.cargar).toHaveBeenCalledWith('ana.torres@confianza.pe');
  });

  it('iconos() siempre incluye "host-inicio" primero, seguido de los sistemas de STG tal cual', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: false, ruta: '/reportes' }]);
    const fixture = crear();

    const iconos = fixture.componentInstance['iconos']();
    expect(iconos[0].id).toBe('host-inicio');
    expect(iconos[1]).toEqual({ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: false, ruta: '/reportes' });
  });

  it('iconos() habilita tienePanel para el sistema STG cuya ruta coincide con la de ranking-k (evita ícono duplicado)', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-rk', tipo: 'remote', icono: 'pi pi-trophy', etiqueta: 'Ranking Kaypacha', tienePanel: false, ruta: RUTA_RANKING_K }]);
    const fixture = crear();

    const icono = fixture.componentInstance['iconos']().find((i) => i.id === 'sist-rk');
    expect(icono?.tienePanel).toBe(true);
  });

  it('panelActivo() para "host-inicio" es el panel fijo del Host ("Mi espacio")', () => {
    const fixture = crear();
    shell.setSidebarIconActivo('host-inicio');

    const panel = fixture.componentInstance['panelActivo']();
    expect(panel?.titulo).toBe('Host Principal');
    expect(panel?.secciones[0].rutas).toEqual([{ etiqueta: 'Mi espacio', ruta: '/app/dashboard', icono: 'lucideGrid' }]);
  });

  it('panelActivo() delega en KaypachaService.panelPara() para el ícono de ranking-k', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-rk', tipo: 'remote', icono: 'pi pi-trophy', etiqueta: 'Ranking Kaypacha', tienePanel: false, ruta: RUTA_RANKING_K }]);
    const fixture = crear();
    shell.setSidebarIconActivo('sist-rk');

    const panel = fixture.componentInstance['panelActivo']();

    expect(kaypachaFalso.panelPara).toHaveBeenCalledWith('Ranking Kaypacha', 'pi pi-trophy');
    expect(panel?.titulo).toBe('Ranking Kaypacha');
  });

  it('panelActivo() arma el panel remoto (STG) a partir de hijosPorSistema para otros sistemas con panel', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi pi-chart-bar', etiqueta: 'Reportes', tienePanel: true }]);
    menuStgFalso.hijosPorSistema.set({ 'sist-1': [{ etiqueta: 'Reporte A', ruta: '/reportes/a' }] });
    const fixture = crear();
    shell.setSidebarIconActivo('sist-1');

    const panel = fixture.componentInstance['panelActivo']();
    expect(panel).toEqual({
      tipo: 'remote',
      titulo: 'Reportes',
      icono: 'pi pi-chart-bar',
      secciones: [{ titulo: 'Reportes', rutas: [{ etiqueta: 'Reporte A', ruta: '/reportes/a' }] }],
    });
  });

  it('panelActivo() es null para un ícono sin panel propio', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Sin panel', tienePanel: false, ruta: '/algo' }]);
    const fixture = crear();
    shell.setSidebarIconActivo('sist-1');

    expect(fixture.componentInstance['panelActivo']()).toBeNull();
  });

  it('seleccionarIcono() siempre marca el ícono activo, tenga panel o no', () => {
    const fixture = crear();
    const icono: SidebarIcon = { id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: false, ruta: '/reportes' };

    fixture.componentInstance['seleccionarIcono'](icono);

    expect(shell.sidebarIconActivo()).toBe('sist-1');
  });

  it('seleccionarIcono() navega directo cuando el ícono no tiene panel', () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = crear();
    const icono: SidebarIcon = { id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: false, ruta: '/reportes' };

    fixture.componentInstance['seleccionarIcono'](icono);

    expect(navSpy).toHaveBeenCalledWith('/reportes');
  });

  it('seleccionarIcono() no navega cuando el ícono sí tiene panel propio', () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl');
    const fixture = crear();
    const icono: SidebarIcon = { id: 'host-inicio', tipo: 'host-inicio', icono: 'pi', etiqueta: 'Inicio', tienePanel: true };

    fixture.componentInstance['seleccionarIcono'](icono);

    expect(navSpy).not.toHaveBeenCalled();
  });

  it('seleccionarIcono() de un enlace externo (Jira/Imparables/Helpdesk) dispara el overlay en vez de navegar', () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl');
    const fixture = crear();
    const icono: SidebarIcon = { id: 'jira', tipo: 'remote', icono: 'pi', etiqueta: 'Jira - Mesa de ayuda', tienePanel: false, ruta: '' };

    fixture.componentInstance['seleccionarIcono'](icono);

    expect(redirectFalso.redirigir).toHaveBeenCalledWith('Jira - Mesa de ayuda', undefined);
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('onRutaSeleccionada() guarda la última parte de la ruta como etiqueta del menú activo', () => {
    const fixture = crear();

    fixture.componentInstance['onRutaSeleccionada']('/app/ranking-k/categoria/cat-1');

    expect(shell.menuItemActivo()).toEqual({ ruta: '/app/ranking-k/categoria/cat-1', etiqueta: 'cat-1' });
  });

  function mockMatchMedia(matches: boolean): void {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as MediaQueryList);
  }

  it('onRutaSeleccionada() colapsa el panel automáticamente en mobile (flota sobre el contenido)', () => {
    mockMatchMedia(true);
    shell.setNavPanelColapsado(false);
    const fixture = crear();

    fixture.componentInstance['onRutaSeleccionada']('/app/ranking-k/categoria/cat-1');

    expect(shell.navPanelColapsado()).toBe(true);
  });

  it('onRutaSeleccionada() no colapsa el panel en desktop (se queda fijo al costado)', () => {
    mockMatchMedia(false);
    shell.setNavPanelColapsado(false);
    const fixture = crear();

    fixture.componentInstance['onRutaSeleccionada']('/app/ranking-k/categoria/cat-1');

    expect(shell.navPanelColapsado()).toBe(false);
  });

  it('muestra un fondo oscuro que bloquea el layout mientras el panel está abierto, y lo cierra al hacer clic', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true }]);
    menuStgFalso.hijosPorSistema.set({ 'sist-1': [{ etiqueta: 'Reporte A', ruta: '/reportes/a' }] });
    const fixture = crear();
    shell.setSidebarIconActivo('sist-1');
    fixture.detectChanges();

    const fondo = (fixture.nativeElement as HTMLElement).querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(fondo).not.toBeNull();

    fondo.click();
    fixture.detectChanges();

    expect(shell.navPanelColapsado()).toBe(true);
  });

  it('no muestra el fondo oscuro cuando el panel está colapsado', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true }]);
    menuStgFalso.hijosPorSistema.set({ 'sist-1': [{ etiqueta: 'Reporte A', ruta: '/reportes/a' }] });
    const fixture = crear();
    shell.setSidebarIconActivo('sist-1');
    shell.setNavPanelColapsado(true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('el botón para alternar el panel usa el estado compartido de ShellStateService (Col 2 se oculta al colapsar)', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true }]);
    menuStgFalso.hijosPorSistema.set({ 'sist-1': [{ etiqueta: 'Reporte A', ruta: '/reportes/a' }] });
    const fixture = crear();
    shell.setSidebarIconActivo('sist-1');
    fixture.detectChanges();

    expect(fixture.componentInstance['panelActivo']()).not.toBeNull();

    shell.toggleNavPanel();
    fixture.detectChanges();

    expect(shell.navPanelColapsado()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('app-sidebar-nav-panel')).toBeNull();
  });
});

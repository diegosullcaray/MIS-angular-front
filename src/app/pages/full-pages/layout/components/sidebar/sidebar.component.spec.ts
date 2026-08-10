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
    // jsdom no implementa matchMedia por defecto y los specs de este proyecto
    // corren con --isolate=false (globals compartidos entre archivos) — sin
    // este stub, si ningún otro spec lo definió antes en la misma corrida,
    // esMobil() revienta con "window.matchMedia is not a function".
    if (typeof window.matchMedia !== 'function') {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
    }

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

  it('carga el menú STG solo si hay un usuario activo con email', () => {
    crear();
    expect(menuStgFalso.cargar).not.toHaveBeenCalled();
  });

  it('carga el menú STG con el email del usuario activo', () => {
    shell.setUsuarioActivo(usuario());
    crear();
    expect(menuStgFalso.cargar).toHaveBeenCalledWith('ana.torres@confianza.pe');
  });

  it('recarga el menú STG reactivamente cuando cambia el usuario activo (cambiar/revertir usuario alterno)', () => {
    shell.setUsuarioActivo(usuario());
    const fixture = crear();
    expect(menuStgFalso.cargar).toHaveBeenCalledWith('ana.torres@confianza.pe');

    shell.setUsuarioActivo(usuario({ id: 'u-2', email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz' }));
    fixture.detectChanges();

    expect(menuStgFalso.cargar).toHaveBeenCalledWith('carlos.ruiz@confianza.pe');
    expect(menuStgFalso.cargar).toHaveBeenCalledTimes(2);
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

  it('iconos() habilita tienePanel para "Analista" aunque STG lo mande como hoja (sin hijos)', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-an', tipo: 'remote', icono: 'pi pi-briefcase', etiqueta: 'Analista', tienePanel: false, ruta: '/app/analista' }]);
    const fixture = crear();

    const icono = fixture.componentInstance['iconos']().find((i) => i.id === 'sist-an');
    expect(icono?.tienePanel).toBe(true);
  });

  it('iconos() habilita tienePanel para "Analista" cuando STG ya lo manda como grupo (con "Categorización" de hijo)', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-an', tipo: 'remote', icono: 'pi pi-briefcase', etiqueta: 'Analista', tienePanel: true }]);
    menuStgFalso.hijosPorSistema.set({ 'sist-an': [{ etiqueta: 'Categorización', ruta: '/app/analista/categorizacion' }] });
    const fixture = crear();

    const icono = fixture.componentInstance['iconos']().find((i) => i.id === 'sist-an');
    expect(icono?.tienePanel).toBe(true);
  });

  it('panelActivo() arma el panel propio de "Analista" (Principal/Categorización/Listas) en vez del panel remoto de STG', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-an', tipo: 'remote', icono: 'pi pi-briefcase', etiqueta: 'Analista', tienePanel: true }]);
    menuStgFalso.hijosPorSistema.set({ 'sist-an': [{ etiqueta: 'Categorización', ruta: '/app/analista/categorizacion' }] });
    const fixture = crear();
    shell.setSidebarIconActivo('sist-an');

    const panel = fixture.componentInstance['panelActivo']();

    expect(panel?.titulo).toBe('Analista');
    expect(panel?.secciones[0].rutas).toEqual([
      { etiqueta: 'Principal', ruta: '/app/analista', icono: 'pi pi-home' },
      { etiqueta: 'Categorización', ruta: '/app/analista/categorizacion', icono: 'pi pi-briefcase' },
      {
        etiqueta: 'Listas',
        icono: 'pi pi-list',
        hijos: [
          { etiqueta: 'Priorización de Leads', ruta: '/app/analista/listas/priorizacion-leads' },
          { etiqueta: 'Becas Financiera Confianza', ruta: '/app/analista/listas/becas' },
        ],
      },
    ]);
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

  it('seleccionarIcono() muestra el panel por defecto al cambiar de sistema, aunque estuviera colapsado del sistema anterior', () => {
    vi.useFakeTimers();
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true }]);
    menuStgFalso.hijosPorSistema.set({ 'sist-1': [{ etiqueta: 'Reporte A', ruta: '/reportes/a' }] });
    const fixture = crear();
    shell.setNavPanelColapsado(true); // quedó colapsado del sistema anterior

    fixture.componentInstance['seleccionarIcono']({ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true });

    expect(shell.navPanelColapsado()).toBe(false);
    vi.useRealTimers();
  });

  it('seleccionarIcono() activa un esqueleto de transición al cambiar a otro sistema, y lo apaga tras 300ms', () => {
    vi.useFakeTimers();
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true }]);
    menuStgFalso.hijosPorSistema.set({ 'sist-1': [{ etiqueta: 'Reporte A', ruta: '/reportes/a' }] });
    const fixture = crear();
    const instancia = fixture.componentInstance;

    instancia['seleccionarIcono']({ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true });

    expect(instancia['cambiandoPanel']()).toBe(true);

    vi.advanceTimersByTime(300);
    expect(instancia['cambiandoPanel']()).toBe(false);
    vi.useRealTimers();
  });

  it('seleccionarIcono() no dispara el esqueleto al re-elegir el mismo sistema ya activo con el panel ya abierto', () => {
    const fixture = crear();
    const instancia = fixture.componentInstance;
    const icono: SidebarIcon = { id: 'host-inicio', tipo: 'host-inicio', icono: 'pi', etiqueta: 'Inicio', tienePanel: true };

    instancia['seleccionarIcono'](icono); // host-inicio ya es el activo por defecto, con el panel abierto

    expect(instancia['cambiandoPanel']()).toBe(false);
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

  it('mientras cambiandoPanel está activo, muestra el esqueleto en vez del panel real (y también el fondo oscuro)', () => {
    const fixture = crear();
    fixture.componentInstance['cambiandoPanel'].set(true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[aria-label="Cargando navegación del sistema"]')).not.toBeNull();
    expect(el.querySelector('app-sidebar-nav-panel')).toBeNull();
    expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
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

  it('sincroniza shell.sidebarTienePanel() con panelActivo(), para que el header sepa si mostrar su botón en mobile', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Sin panel', tienePanel: false, ruta: '/algo' }]);
    const fixture = crear();

    // "Inicio" (host-inicio) siempre tiene panel propio (Mi espacio).
    expect(shell.sidebarTienePanel()).toBe(true);

    shell.setSidebarIconActivo('sist-1');
    fixture.detectChanges();

    expect(shell.sidebarTienePanel()).toBe(false);
  });

  it('el botón de hamburguesa del rail (Col 1) queda oculto en mobile — en mobile ese botón vive en el header', () => {
    const fixture = crear();

    const boton = (fixture.nativeElement as HTMLElement).querySelector('#tour-sidebar-icons button[aria-label="Alternar menú lateral"]') as HTMLButtonElement;

    expect(boton).not.toBeNull();
    expect(boton.classList.contains('hidden')).toBe(true);
    expect(boton.classList.contains('sm:flex')).toBe(true);
  });

  it('los botones de íconos de la barra inferior en mobile son cuadrados (mismo ancho y alto), no rectángulos', () => {
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: false, ruta: '/reportes' }]);
    const fixture = crear();

    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('.sidebar-icon-btn');
    expect(botones.length).toBeGreaterThan(0);
    botones.forEach((boton) => {
      expect(boton.classList.contains('w-12')).toBe(true);
      expect(boton.classList.contains('h-12')).toBe(true);
    });

    const contenedor = (fixture.nativeElement as HTMLElement).querySelector('#tour-sidebar-icons > div:last-child') as HTMLElement;
    expect(contenedor.classList.contains('items-stretch')).toBe(false);
    expect(contenedor.classList.contains('items-center')).toBe(true);
  });
});

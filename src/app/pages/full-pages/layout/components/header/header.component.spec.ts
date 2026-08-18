import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from './header.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { AuthService } from '../../../auth/service/auth.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavRuta } from '../../interfaces/sidebar.model';

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
  let authFalso: {
    cerrarSesion: ReturnType<typeof vi.fn>;
    esUsuarioAlterno: ReturnType<typeof vi.fn>;
    puedeCambiarUsuario: ReturnType<typeof vi.fn>;
    alternates: ReturnType<typeof vi.fn>;
    cambiarAUsuarioAlterno: ReturnType<typeof vi.fn>;
    volverAUsuarioOriginal: ReturnType<typeof vi.fn>;
  };
  let menuStgFalso: { sistemas: ReturnType<typeof signal<SidebarIcon[]>>; buscarPorRuta: ReturnType<typeof vi.fn> };
  let kaypachaFalso: { buscarCategoria: ReturnType<typeof vi.fn> };
  let navegacionFalso: {
    panelActivo: ReturnType<typeof signal<SidebarNavPanelConfig | null>>;
    rutaExplorador: ReturnType<typeof signal<SidebarNavRuta[]>>;
    abrirEnCarpeta: ReturnType<typeof vi.fn>;
    irANivel: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authFalso = {
      cerrarSesion: vi.fn(),
      esUsuarioAlterno: vi.fn().mockReturnValue(false),
      puedeCambiarUsuario: vi.fn().mockReturnValue(false),
      alternates: vi.fn().mockReturnValue([]),
      cambiarAUsuarioAlterno: vi.fn().mockResolvedValue(undefined),
      volverAUsuarioOriginal: vi.fn(),
    };
    menuStgFalso = { sistemas: signal<SidebarIcon[]>([]), buscarPorRuta: vi.fn().mockReturnValue(null) };
    kaypachaFalso = { buscarCategoria: vi.fn().mockReturnValue(undefined) };
    navegacionFalso = {
      panelActivo: signal<SidebarNavPanelConfig | null>(null),
      rutaExplorador: signal<SidebarNavRuta[]>([]),
      abrirEnCarpeta: vi.fn(),
      irANivel: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([{ path: '**', component: BlankComponent }]),
        { provide: AuthService, useValue: authFalso },
        { provide: MenuStgService, useValue: menuStgFalso },
        { provide: KaypachaService, useValue: kaypachaFalso },
        { provide: NavegacionSistemasService, useValue: navegacionFalso },
        MessageService,
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

  it('breadcrumb de una ruta anidada de Presupuesto usa las etiquetas legibles de cada segmento', async () => {
    const fixture = await crear('/app/presupuesto/lineas/pasivos-patrimonio/car-dep-bp');

    expect(fixture.componentInstance['breadcrumbItems']()).toEqual([
      { label: 'Presupuesto', routerLink: '/app/presupuesto' },
      { label: 'Líneas', routerLink: '/app/presupuesto/lineas' },
      { label: 'Pasivos y Patrimonio', routerLink: '/app/presupuesto/lineas/pasivos-patrimonio' },
      { label: 'Depósitos Banca Preferente' },
    ]);
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

  it('breadcrumb de un sistema remoto de STG usa el árbol de MenuStgService, con cada nivel salvo el actual clickeable', async () => {
    const nodoClientes: SidebarNavRuta = { etiqueta: 'Clientes', hijos: [{ etiqueta: 'CMG Clientes Flujo', ruta: '/app/actividad-mensual/clientes/cmg' }] };
    const nodoHoja = nodoClientes.hijos![0];
    menuStgFalso.buscarPorRuta.mockReturnValue({ sistemaId: 'sist-1', nodos: [nodoClientes, nodoHoja] });
    menuStgFalso.sistemas.set([{ id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Actividad Mensual', tienePanel: true }]);

    const fixture = await crear('/app/actividad-mensual/clientes/cmg');
    const items = fixture.componentInstance['breadcrumbItems']();

    expect(items.map((i) => i.label)).toEqual(['Actividad Mensual', 'Clientes', 'CMG Clientes Flujo']);
    // El último (la pantalla actual) no navega a ningún lado; los anteriores sí.
    expect(items[2].command).toBeUndefined();

    items[0].command!({} as never);
    expect(navegacionFalso.abrirEnCarpeta).toHaveBeenCalledWith('sist-1', []);

    items[1].command!({} as never);
    expect(navegacionFalso.abrirEnCarpeta).toHaveBeenCalledWith('sist-1', [nodoClientes]);
  });

  it('mientras se muestra el explorador del sistema, el breadcrumb refleja la carpeta abierta y vuelve a su nivel al hacer clic', async () => {
    const carpetaA: SidebarNavRuta = { etiqueta: 'Avance Comercial', hijos: [] };
    navegacionFalso.panelActivo.set({ tipo: 'remote', titulo: 'Reportes', icono: 'pi', secciones: [] });
    navegacionFalso.rutaExplorador.set([carpetaA]);
    shell.setContenidoPendienteSeleccion(true);

    const fixture = await crear('/app/reportes/leg/com/rda/adm/mon-desem');
    const items = fixture.componentInstance['breadcrumbItems']();

    expect(items.map((i) => i.label)).toEqual(['Reportes', 'Avance Comercial']);

    items[0].command!({} as never);
    expect(navegacionFalso.irANivel).toHaveBeenCalledWith(-1);

    items[1].command!({} as never);
    expect(navegacionFalso.irANivel).toHaveBeenCalledWith(0);
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

  it('no tiene botón de alternar el panel: en mobile la Col 2 ya no es alcanzable, la navegación vive en el explorador', async () => {
    const fixture = await crear('/app/dashboard');

    expect((fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Alternar menú lateral"]')).toBeNull();
  });

  describe('Cambiar usuario', () => {
    it('no muestra "Cambiar usuario" ni "Mi usuario" cuando no aplica ninguno', async () => {
      const fixture = await crear('/app/dashboard');
      fixture.componentInstance['toggleDropdown']();
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).not.toContain('Cambiar usuario');
      expect(texto).not.toContain('Mi usuario');
    });

    it('muestra "Cambiar usuario" cuando el usuario activo tiene alternates asignados', async () => {
      authFalso.puedeCambiarUsuario.mockReturnValue(true);
      const fixture = await crear('/app/dashboard');
      fixture.componentInstance['toggleDropdown']();
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cambiar usuario');
    });

    it('abrirCambiarUsuario() cierra el dropdown y abre el diálogo de cambiar usuario', async () => {
      const fixture = await crear('/app/dashboard');
      const instancia = fixture.componentInstance;
      instancia['toggleDropdown']();

      instancia['abrirCambiarUsuario']();

      expect(instancia['dropdownOpen']()).toBe(false);
      expect(instancia['cambiarUsuarioOpen']()).toBe(true);
    });

    it('muestra "Mi usuario" y el aro de aviso en el avatar cuando se está viendo como un usuario alterno', async () => {
      authFalso.esUsuarioAlterno.mockReturnValue(true);
      const fixture = await crear('/app/dashboard');
      fixture.componentInstance['toggleDropdown']();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Mi usuario');
      expect(el.querySelector('.avatar-alterno')).not.toBeNull();
    });

    it('volverAUsuarioOriginal() cierra el dropdown y delega en AuthService', async () => {
      const fixture = await crear('/app/dashboard');
      const instancia = fixture.componentInstance;
      instancia['toggleDropdown']();

      instancia['volverAUsuarioOriginal']();

      expect(instancia['dropdownOpen']()).toBe(false);
      expect(authFalso.volverAUsuarioOriginal).toHaveBeenCalled();
    });
  });
});

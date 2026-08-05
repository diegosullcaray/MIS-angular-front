import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarNavPanelComponent } from './sidebar-nav-panel.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { SidebarNavPanelConfig } from '../../interfaces/sidebar.model';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: [],
    ...overrides,
  };
}

describe('SidebarNavPanelComponent', () => {
  let shell: ShellStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SidebarNavPanelComponent],
      providers: [provideRouter([])],
    });
    shell = TestBed.inject(ShellStateService);
  });

  function crear(config: SidebarNavPanelConfig) {
    const fixture = TestBed.createComponent(SidebarNavPanelComponent);
    fixture.componentRef.setInput('panelConfig', config);
    fixture.detectChanges();
    return fixture;
  }

  it('esArbol es true cuando el panel es tipo "remote" (STG) y false para "host-admin"', () => {
    const remoto = crear({ tipo: 'remote', titulo: 'X', icono: 'pi pi-home', secciones: [{ rutas: [] }] });
    expect(remoto.componentInstance['secciones']()[0].esArbol).toBe(true);

    const host = crear({ tipo: 'host-admin', titulo: 'X', icono: 'pi pi-home', secciones: [{ rutas: [] }] });
    expect(host.componentInstance['secciones']()[0].esArbol).toBe(false);
  });

  it('filtra rutas soloAdminSistema para un usuario que no es admin-sistema', () => {
    shell.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));
    const fixture = crear({
      tipo: 'host-admin',
      titulo: 'X',
      icono: 'pi pi-home',
      secciones: [{ rutas: [{ etiqueta: 'Solo admin sistema', ruta: '/x', soloAdminSistema: true }, { etiqueta: 'Todos', ruta: '/y' }] }],
    });

    const visibles = fixture.componentInstance['secciones']()[0].rutasVisibles;
    expect(visibles.map((r: { etiqueta: string }) => r.etiqueta)).toEqual(['Todos']);
  });

  it('muestra rutas soloAdminSistema cuando el usuario sí es admin-sistema', () => {
    shell.setUsuarioActivo(usuario({ rol: 'admin-sistema' }));
    const fixture = crear({
      tipo: 'host-admin',
      titulo: 'X',
      icono: 'pi pi-home',
      secciones: [{ rutas: [{ etiqueta: 'Solo admin sistema', ruta: '/x', soloAdminSistema: true }] }],
    });

    expect(fixture.componentInstance['secciones']()[0].rutasVisibles.length).toBe(1);
  });

  it('filtra rutas soloAdmin para un usuario sin permisos de admin', () => {
    shell.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));
    const fixture = crear({
      tipo: 'host-admin',
      titulo: 'X',
      icono: 'pi pi-home',
      secciones: [{ rutas: [{ etiqueta: 'Solo admin', ruta: '/x', soloAdmin: true }] }],
    });

    expect(fixture.componentInstance['secciones']()[0].rutasVisibles).toEqual([]);
  });

  it('handleExpandChange colapsa el nodo si se hace clic en el mismo índice ya expandido', () => {
    const fixture = crear({ tipo: 'remote', titulo: 'X', icono: 'pi pi-home', secciones: [{ rutas: [] }] });
    const instancia = fixture.componentInstance;

    instancia['handleExpandChange']({ depth: 0, index: 2 });
    expect(instancia['currentExpandedIndex']()).toEqual([2]);

    instancia['handleExpandChange']({ depth: 0, index: 2 });
    expect(instancia['currentExpandedIndex']()).toEqual([-1]);
  });

  it('handleExpandChange trunca cualquier rama más profunda al cambiar un nivel superior', () => {
    const fixture = crear({ tipo: 'remote', titulo: 'X', icono: 'pi pi-home', secciones: [{ rutas: [] }] });
    const instancia = fixture.componentInstance;

    instancia['handleExpandChange']({ depth: 0, index: 1 });
    instancia['handleExpandChange']({ depth: 1, index: 3 });
    expect(instancia['currentExpandedIndex']()).toEqual([1, 3]);

    instancia['handleExpandChange']({ depth: 0, index: 5 }); // cambia el nivel raíz
    expect(instancia['currentExpandedIndex']()).toEqual([5]); // se pierde la rama de nivel 1
  });

  it('al cambiar de panelConfig, se resetea currentExpandedIndex (ningún nodo queda expandido del sistema anterior)', () => {
    const fixture = crear({ tipo: 'remote', titulo: 'A', icono: 'pi pi-home', secciones: [{ rutas: [] }] });
    fixture.componentInstance['handleExpandChange']({ depth: 0, index: 2 });
    expect(fixture.componentInstance['currentExpandedIndex']()).toEqual([2]);

    fixture.componentRef.setInput('panelConfig', { tipo: 'remote', titulo: 'B', icono: 'pi pi-home', secciones: [{ rutas: [] }] });
    fixture.detectChanges();

    expect(fixture.componentInstance['currentExpandedIndex']()).toEqual([]);
  });
});

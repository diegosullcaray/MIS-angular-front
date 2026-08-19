import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { FuenteNavegacionService } from './fuente-navegacion.service';
import { NavegacionSistemasService } from './navegacion-sistemas.service';
import { MenuStgService } from './menu-stg.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { KaypachaService } from '../../../modules/ranking-k/services/kaypacha.service';
import type { SidebarIcon, SidebarNavRuta } from '../interfaces/sidebar.model';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';

@Component({ selector: 'app-blank', standalone: true, template: '' })
class BlankComponent {}

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: [],
    ...overrides,
  };
}

describe('FuenteNavegacionService', () => {
  let fuente: FuenteNavegacionService;
  let navegacion: NavegacionSistemasService;
  let shell: ShellStateService;
  let router: Router;
  let menuStgFalso: {
    sistemas: ReturnType<typeof signal<SidebarIcon[]>>;
    hijosPorSistema: ReturnType<typeof signal<Record<string, SidebarNavRuta[]>>>;
    cargar: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    menuStgFalso = {
      sistemas: signal<SidebarIcon[]>([]),
      hijosPorSistema: signal<Record<string, SidebarNavRuta[]>>({}),
      cargar: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: BlankComponent }]),
        { provide: MenuStgService, useValue: menuStgFalso },
        {
          provide: KaypachaService,
          useValue: { ruta: '/app/ranking-k', panelPara: vi.fn(), cargarCategorias: vi.fn() },
        },
      ],
    });

    fuente = TestBed.inject(FuenteNavegacionService);
    navegacion = TestBed.inject(NavegacionSistemasService);
    shell = TestBed.inject(ShellStateService);
    router = TestBed.inject(Router);
  });

  /** Un sistema con un reporte público y otro restringido a administradores. */
  function sistemaConNodoRestringido(flag: 'soloAdmin' | 'soloAdminSistema') {
    menuStgFalso.sistemas.set([
      { id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true },
    ]);
    menuStgFalso.hijosPorSistema.set({
      'sist-1': [
        { etiqueta: 'Cartera', ruta: '/app/reportes/cartera' },
        { etiqueta: 'Auditoría', ruta: '/app/reportes/auditoria', [flag]: true },
      ],
    });
  }

  /**
   * Etiquetas del sistema bajo prueba. Se deja afuera el panel fijo del Host
   * ("Mi espacio"), que se indexa siempre y no aporta nada a estos casos.
   */
  function etiquetas(sistema = 'Reportes'): string[] {
    return fuente
      .registros()
      .filter((r) => r.origen === sistema)
      .map((r) => r.etiqueta);
  }

  describe('permisos', () => {
    it('no indexa un nodo soloAdmin para un usuario sin rol administrador', () => {
      sistemaConNodoRestringido('soloAdmin');
      shell.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));

      expect(etiquetas()).toEqual(['Cartera']);
    });

    it('sí lo indexa para un administrador', () => {
      sistemaConNodoRestringido('soloAdmin');
      shell.setUsuarioActivo(usuario({ rol: 'admin-general' }));

      expect(etiquetas()).toEqual(['Cartera', 'Auditoría']);
    });

    it('un nodo soloAdminSistema no alcanza con ser admin-general', () => {
      sistemaConNodoRestringido('soloAdminSistema');
      shell.setUsuarioActivo(usuario({ rol: 'admin-general' }));

      expect(etiquetas()).toEqual(['Cartera']);
    });

    it('sí lo indexa para admin-sistema', () => {
      sistemaConNodoRestringido('soloAdminSistema');
      shell.setUsuarioActivo(usuario({ rol: 'admin-sistema' }));

      expect(etiquetas()).toEqual(['Cartera', 'Auditoría']);
    });

    it('el filtro también aplica a los nodos anidados, no solo al primer nivel', () => {
      menuStgFalso.sistemas.set([
        { id: 'sist-1', tipo: 'remote', icono: 'pi', etiqueta: 'Reportes', tienePanel: true },
      ]);
      menuStgFalso.hijosPorSistema.set({
        'sist-1': [
          {
            etiqueta: 'Gestión',
            hijos: [
              { etiqueta: 'Resumen', ruta: '/app/reportes/resumen' },
              { etiqueta: 'Accesos', ruta: '/app/reportes/accesos', soloAdmin: true },
            ],
          },
        ],
      });
      shell.setUsuarioActivo(usuario({ rol: 'supervisor-area' }));

      expect(etiquetas()).toEqual(['Gestión', 'Resumen']);
    });

    it('se recalcula al cambiar de usuario, para no dejar expuesto lo del anterior', () => {
      sistemaConNodoRestringido('soloAdmin');
      shell.setUsuarioActivo(usuario({ rol: 'admin-general' }));
      expect(etiquetas()).toContain('Auditoría');

      // "Cambiar usuario": el nuevo no es administrador.
      shell.setUsuarioActivo(usuario({ id: 'u-2', email: 'juan@confianza.pe', rol: 'supervisor-area' }));

      expect(etiquetas()).not.toContain('Auditoría');
    });

    it('solo recorre los sistemas que el backend devolvió para ese usuario', () => {
      menuStgFalso.sistemas.set([]);
      shell.setUsuarioActivo(usuario({ rol: 'admin-sistema' }));

      // Sin sistemas remotos no se inventa ninguno: queda solo el panel del Host.
      expect(fuente.registros().map((r) => r.etiqueta)).toEqual(['Mi espacio']);
    });
  });

  describe('registros', () => {
    beforeEach(() => {
      sistemaConNodoRestringido('soloAdmin');
      shell.setUsuarioActivo(usuario({ rol: 'admin-sistema' }));
    });

    it('usa el sistema que lo contiene como módulo de la faceta', () => {
      expect(fuente.registros().find((r) => r.etiqueta === 'Cartera')?.origen).toBe('Reportes');
    });

    it('abrir una hoja navega a su ruta y marca su sistema como activo', () => {
      const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      shell.setContenidoPendienteSeleccion(true);

      fuente.registros().find((r) => r.etiqueta === 'Cartera')!.abrir();

      expect(navegar).toHaveBeenCalledWith('/app/reportes/cartera');
      expect(shell.sidebarIconActivo()).toBe('sist-1');
      expect(shell.contenidoPendienteSeleccion()).toBe(false);
    });

    it('abrir una carpeta la sitúa en el explorador, sin navegar', () => {
      menuStgFalso.hijosPorSistema.set({
        'sist-1': [{ etiqueta: 'Gestión', hijos: [{ etiqueta: 'Resumen', ruta: '/app/reportes/resumen' }] }],
      });
      const navegar = vi.spyOn(router, 'navigateByUrl');

      fuente.registros().find((r) => r.etiqueta === 'Gestión')!.abrir();

      expect(shell.sidebarIconActivo()).toBe('sist-1');
      expect(navegacion.rutaExplorador().map((c) => c.etiqueta)).toEqual(['Gestión']);
      expect(navegar).not.toHaveBeenCalled();
    });
  });
});

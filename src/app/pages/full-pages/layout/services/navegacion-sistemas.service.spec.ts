import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Location } from '@angular/common';
import { NavegacionSistemasService } from './navegacion-sistemas.service';
import { MenuStgService } from './menu-stg.service';
import { KaypachaService } from '../../../modules/ranking-k/services/kaypacha.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { SidebarIcon, SidebarNavRuta } from '../interfaces/sidebar.model';

describe('NavegacionSistemasService', () => {
  let replaceState: ReturnType<typeof vi.fn>;
  let menuStg: { sistemas: ReturnType<typeof signal<SidebarIcon[]>>; hijosPorSistema: ReturnType<typeof signal<Record<string, SidebarNavRuta[]>>> };

  function crear() {
    replaceState = vi.fn();
    menuStg = { sistemas: signal<SidebarIcon[]>([]), hijosPorSistema: signal<Record<string, SidebarNavRuta[]>>({}) };
    TestBed.configureTestingModule({
      providers: [
        { provide: MenuStgService, useValue: menuStg },
        { provide: KaypachaService, useValue: { ruta: '/app/Kaypacha__', panelPara: vi.fn(), cargarCategorias: vi.fn() } },
        { provide: Location, useValue: { replaceState } },
      ],
    });
    return TestBed.inject(NavegacionSistemasService);
  }

  describe('actualizarUrlExplorador()', () => {
    /** Regresión: el "Volver" desde Inicio escribía `/app/host-inicio`, una URL que no existe. */
    it('en un sistema sin ruta propia (Inicio) no reescribe la URL', () => {
      const servicio = crear();
      TestBed.inject(ShellStateService).setSidebarIconActivo('host-inicio');

      servicio.actualizarUrlExplorador();

      expect(replaceState).not.toHaveBeenCalled();
    });

    it('en un sistema con ruta refleja la carpeta abierta, recargable por el comodín del módulo', () => {
      const servicio = crear();
      menuStg.sistemas.set([
        { id: 'sist-rep', tipo: 'remote', icono: 'pi pi-chart-bar', etiqueta: 'Reportes', tienePanel: true, ruta: '/app/reportes' },
      ]);
      TestBed.inject(ShellStateService).setSidebarIconActivo('sist-rep');

      servicio.entrarCarpeta({ etiqueta: 'Avance Comercial', hijos: [] });

      expect(replaceState).toHaveBeenLastCalledWith('/app/reportes/avance-comercial');
    });

    it('en la raíz de un sistema con ruta deja solo la ruta base', () => {
      const servicio = crear();
      menuStg.sistemas.set([
        { id: 'sist-rep', tipo: 'remote', icono: 'pi pi-chart-bar', etiqueta: 'Reportes', tienePanel: true, ruta: '/app/reportes' },
      ]);
      TestBed.inject(ShellStateService).setSidebarIconActivo('sist-rep');

      servicio.actualizarUrlExplorador();

      expect(replaceState).toHaveBeenCalledWith('/app/reportes');
    });
  });
});

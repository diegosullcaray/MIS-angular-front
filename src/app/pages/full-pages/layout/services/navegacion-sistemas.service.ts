import { Injectable, computed, inject } from '@angular/core';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { MenuStgService } from './menu-stg.service';
import { KaypachaService } from '../../../modules/ranking-k/services/kaypacha.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavRuta } from '../interfaces/sidebar.model';

/**
 * Árbol de navegación de cada sistema, extraído de `SidebarComponent` para que
 * lo compartan las dos superficies que hoy lo consumen: el rail de sistemas
 * (Col 1) y el explorador de archivos del área de contenido
 * (`ExploradorSistemaComponent`), que reemplazó al panel de links de la Col 2.
 */
@Injectable({ providedIn: 'root' })
export class NavegacionSistemasService {
  private readonly shell = inject(ShellStateService);
  private readonly menuStg = inject(MenuStgService);
  private readonly kaypacha = inject(KaypachaService);

  /** Lista combinada de íconos base y los que provienen del backend STG. */
  readonly iconos = computed<SidebarIcon[]>(() => {
    const base: SidebarIcon[] = [
      { id: 'host-inicio', tipo: 'host-inicio', icono: 'pi pi-home', etiqueta: 'Inicio', tienePanel: true },
    ];

    const sistemasStg = this.menuStg.sistemas().map((sistema) => {
      if (sistema.ruta === this.kaypacha.ruta || this.esAnalista(sistema)) return { ...sistema, tienePanel: true };
      // "Dashboards Integrados" (`reportes-e` del legado) todavía manda un hijo
      // "usuarios" en el árbol del backend (`menu-stg.service.ts`), pero esa
      // pantalla ya no es una ruta — se migró a un diálogo responsive
      // (`UsuariosReporteDialogComponent`, ver `dashboard.routes.ts`). Sin este
      // override, `tienePanel: !!hijos` abre un explorador con un único ítem
      // muerto para un sistema que en realidad no tiene subnavegación.
      // `ruta` también hay que fijarla acá: `menu-stg.service.ts` solo la
      // completa cuando `hijos` es falsy, así que mientras el backend siga
      // mandando ese nodo llega undefined — sin esto el clic no navegaría
      // a ningún lado (`DASHBOARD_ROUTES` monta en `/app/dashboards`).
      if (this.esDashboardsIntegrados(sistema)) return { ...sistema, tienePanel: false, ruta: '/app/dashboards' };
      return sistema;
    });

    return [...base, ...sistemasStg];
  });

  /** Navegación del sistema activo. Es `null` si el sistema no tiene subnavegación. */
  readonly panelActivo = computed<SidebarNavPanelConfig | null>(() => {
    const id = this.shell.sidebarIconActivo();

    if (id === 'host-inicio') return this.getPanelHost();

    const icono = this.iconos().find((i) => i.id === id);
    if (!icono?.tienePanel) return null;

    if (icono.ruta === this.kaypacha.ruta) return this.kaypacha.panelPara(icono.etiqueta, icono.icono);
    if (this.esAnalista(icono)) return this.getPanelAnalista(icono.etiqueta, icono.icono);

    return this.getPanelStg(id);
  });

  /**
   * Nodos raíz del sistema activo, ya filtrados por permisos y aplanados: el
   * explorador muestra un solo nivel por vez, así que las secciones del panel
   * (que solo agrupaban visualmente) se concatenan en una sola carpeta raíz.
   */
  readonly nodosRaiz = computed<SidebarNavRuta[]>(() => {
    const panel = this.panelActivo();
    if (!panel) return [];
    return panel.secciones.flatMap((seccion) => this.filtrarVisibles(seccion.rutas));
  });

  /** Descarta los nodos que el rol del usuario no puede ver. */
  filtrarVisibles(rutas: SidebarNavRuta[]): SidebarNavRuta[] {
    return rutas.filter((ruta) => {
      if (ruta.soloAdminSistema && !this.shell.esAdminSistema()) return false;
      if (ruta.soloAdmin && !this.shell.esAdmin()) return false;
      return true;
    });
  }

  private esAnalista(icono: SidebarIcon): boolean {
    return (icono.etiqueta || '').trim().toLowerCase() === 'analista';
  }

  private esDashboardsIntegrados(icono: SidebarIcon): boolean {
    return (icono.etiqueta || '').trim().toLowerCase() === 'dashboards integrados';
  }

  private getPanelHost(): SidebarNavPanelConfig {
    return {
      tipo: 'host-admin',
      titulo: 'Host Principal',
      icono: 'pi pi-home',
      secciones: [
        {
          titulo: 'Acceso directo',
          rutas: [{ etiqueta: 'Mi espacio', ruta: '/app/dashboard', icono: 'lucideGrid' }],
        },
      ],
    };
  }

  private getPanelAnalista(titulo: string, icono: string): SidebarNavPanelConfig {
    return {
      tipo: 'host-admin',
      titulo,
      icono,
      secciones: [
        {
          rutas: [
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
          ],
        },
      ],
    };
  }

  /** Panel para módulos legacy no migrados, basándose en la data del menú STG. */
  private getPanelStg(slug: string): SidebarNavPanelConfig {
    const hijosStg = this.menuStg.hijosPorSistema()[slug] ?? [];
    const stg = this.menuStg.sistemas().find((s) => s.id === slug);
    const titulo = stg?.etiqueta ?? slug;

    return {
      tipo: 'remote',
      titulo,
      icono: stg?.icono ?? 'pi pi-th-large',
      secciones: [{ titulo, rutas: hijosStg }],
    };
  }
}

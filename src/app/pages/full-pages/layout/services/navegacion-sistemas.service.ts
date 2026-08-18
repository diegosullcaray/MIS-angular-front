import { Injectable, computed, inject, signal } from '@angular/core';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { MenuStgService } from './menu-stg.service';
import { KaypachaService } from '../../../modules/ranking-k/services/kaypacha.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavRuta } from '../interfaces/sidebar.model';

/**
 * Árbol de navegación de cada sistema y ubicación actual dentro de él. Lo
 * comparten el rail de sistemas (Col 1), el explorador del área de contenido y
 * el breadcrumb del header, que es donde se refleja esa ubicación.
 */
@Injectable({ providedIn: 'root' })
export class NavegacionSistemasService {
  private readonly shell = inject(ShellStateService);
  private readonly menuStg = inject(MenuStgService);
  private readonly kaypacha = inject(KaypachaService);

  /** Carpetas abiertas en el explorador, de la más externa a la actual. */
  readonly rutaExplorador = signal<SidebarNavRuta[]>([]);

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
   * Contenido de la carpeta abierta. En la raíz se aplanan las secciones del
   * panel, que solo agrupaban visualmente.
   */
  readonly nodosActuales = computed<SidebarNavRuta[]>(() => {
    const ruta = this.rutaExplorador();
    if (ruta.length) return this.filtrarVisibles(ruta[ruta.length - 1].hijos ?? []);

    const panel = this.panelActivo();
    return panel ? panel.secciones.flatMap((s) => this.filtrarVisibles(s.rutas)) : [];
  });

  entrarCarpeta(nodo: SidebarNavRuta): void {
    this.rutaExplorador.update((r) => [...r, nodo]);
  }

  /** Vuelve al nivel indicado dentro del sistema activo; `-1` es su raíz. */
  irANivel(indice: number): void {
    this.rutaExplorador.update((r) => r.slice(0, indice + 1));
  }

  /**
   * Reabre el explorador de `sistemaId` posicionado en `carpetas` — usado por
   * el breadcrumb del header para volver desde una pantalla ya abierta a la
   * carpeta de la que salió (`HeaderComponent.breadcrumbRemote`).
   */
  abrirEnCarpeta(sistemaId: string, carpetas: SidebarNavRuta[]): void {
    this.shell.setSidebarIconActivo(sistemaId);
    this.rutaExplorador.set(carpetas);
    this.shell.setContenidoPendienteSeleccion(true);
  }

  /** Descarta los nodos que el rol del usuario no puede ver. */
  private filtrarVisibles(rutas: SidebarNavRuta[]): SidebarNavRuta[] {
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

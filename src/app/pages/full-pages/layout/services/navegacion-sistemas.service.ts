import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { MenuStgService } from './menu-stg.service';
import { KaypachaService } from '../../../modules/ranking-k/services/kaypacha.service';
import { Location } from '@angular/common';
import type { RegistroNavegacion, SidebarIcon, SidebarNavPanelConfig, SidebarNavRuta } from '../interfaces/sidebar.model';

/** Árbol de navegación de cada sistema y ubicación actual; lo comparten el rail de sistemas, el explorador y el breadcrumb del header. */
@Injectable({ providedIn: 'root' })
export class NavegacionSistemasService {
  private readonly shell = inject(ShellStateService);
  private readonly menuStg = inject(MenuStgService);
  private readonly kaypacha = inject(KaypachaService);
  private readonly location = inject(Location);

  /** Carpetas abiertas en el explorador, de la más externa a la actual. */
  readonly rutaExplorador = signal<SidebarNavRuta[]>([]);

  /** Lista combinada de íconos base y los que provienen del backend STG. */
  readonly iconos = computed<SidebarIcon[]>(() => {
    const base: SidebarIcon[] = [
      { id: 'host-inicio', tipo: 'host-inicio', icono: 'pi pi-home', etiqueta: 'Inicio', tienePanel: true },
    ];

    const sistemasStg = this.menuStg.sistemas().map((sistema) => {
      if (sistema.ruta === this.kaypacha.ruta || this.esAnalista(sistema)) return { ...sistema, tienePanel: true };
      // El backend sigue mandando un hijo "usuarios" que ya es un diálogo, no una ruta:
      // sin este override el sistema abriría un explorador con un único ítem muerto y sin `ruta`.
      if (this.esDashboardsIntegrados(sistema)) return { ...sistema, tienePanel: false, ruta: '/app/dashboards' };
      return sistema;
    });

    return [...base, ...sistemasStg];
  });

  /** Navegación del sistema activo. Es `null` si el sistema no tiene subnavegación. */
  readonly panelActivo = computed<SidebarNavPanelConfig | null>(() => this.panelDe(this.shell.sidebarIconActivo()));

  constructor() {
    // El explorador se pinta desde el shell, no desde una ruta. Publicar acá si
    // existe es lo que le permite al "Volver" de cualquier pantalla regresar a
    // él: sin esto tendría que adivinarlo del historial, donde ese paso no
    // dejó huella. Ver `ShellStateService.exploradorDisponible`.
    effect(() => this.shell.setExploradorDisponible(this.panelActivo() !== null));
  }

  /** Navegación de cualquier sistema: el buscador los necesita todos a la vez. */
  panelDe(id: string): SidebarNavPanelConfig | null {
    if (id === 'host-inicio') return this.getPanelHost();

    const icono = this.iconos().find((i) => i.id === id);
    if (!icono?.tienePanel) return null;

    if (icono.ruta === this.kaypacha.ruta) return this.kaypacha.panelPara(icono.etiqueta, icono.icono);
    if (this.esAnalista(icono)) return this.getPanelAnalista(icono.etiqueta, icono.icono);

    return this.getPanelStg(id);
  }

  /** Árbol aplanado a cualquier profundidad para que el buscador encuentre un reporte sin saber su carpeta; respeta permisos vía `filtrarVisibles`. */
  readonly registros = computed<RegistroNavegacion[]>(() => {
    const registros: RegistroNavegacion[] = [];

    for (const icono of this.iconos()) {
      const panel = this.panelDe(icono.id);

      // Sin subnavegación el propio ícono es el destino, así que se indexa él.
      if (!panel) {
        if (!icono.ruta) continue;
        registros.push({
          id: icono.id,
          etiqueta: icono.etiqueta,
          sistema: icono.etiqueta,
          sistemaId: icono.id,
          tipo: 'Reporte',
          ruta: icono.ruta,
          icono: icono.icono,
          carpetas: [],
          nodo: { etiqueta: icono.etiqueta, ruta: icono.ruta },
          ubicacion: icono.etiqueta,
        });
        continue;
      }

      const recorrer = (nodos: SidebarNavRuta[], carpetas: SidebarNavRuta[]): void => {
        for (const nodo of this.filtrarVisibles(nodos)) {
          const esCarpeta = (nodo.hijos?.length ?? 0) > 0;

          registros.push({
            id: `${icono.id}/${[...carpetas, nodo].map((c) => c.etiqueta).join('/')}`,
            etiqueta: nodo.etiqueta,
            sistema: panel.titulo,
            sistemaId: icono.id,
            tipo: esCarpeta ? 'Carpeta' : 'Reporte',
            ruta: nodo.ruta,
            icono: nodo.icono,
            carpetas,
            nodo,
            ubicacion: [panel.titulo, ...carpetas.map((c) => c.etiqueta)].join(' › '),
          });

          if (esCarpeta) recorrer(nodo.hijos ?? [], [...carpetas, nodo]);
        }
      };

      recorrer(
        panel.secciones.flatMap((s) => s.rutas),
        []
      );
    }

    return registros;
  });

  /** Contenido de la carpeta abierta; en la raíz se aplanan las secciones, que solo agrupaban visualmente. */
  readonly nodosActuales = computed<SidebarNavRuta[]>(() => {
    const ruta = this.rutaExplorador();
    if (ruta.length) return this.filtrarVisibles(ruta[ruta.length - 1].hijos ?? []);

    const panel = this.panelActivo();
    return panel ? panel.secciones.flatMap((s) => this.filtrarVisibles(s.rutas)) : [];
  });

  entrarCarpeta(nodo: SidebarNavRuta): void {
    this.rutaExplorador.update((r) => [...r, nodo]);
    this.actualizarUrlExplorador();
  }

  /** Vuelve al nivel indicado dentro del sistema activo; `-1` es su raíz. */
  irANivel(indice: number): void {
    this.rutaExplorador.update((r) => r.slice(0, indice + 1));
    this.actualizarUrlExplorador();
  }

  /** Reabre el explorador de `sistemaId` en `carpetas`; lo usa el breadcrumb para volver a la carpeta de la que salió la pantalla. */
  abrirEnCarpeta(sistemaId: string, carpetas: SidebarNavRuta[]): void {
    this.shell.setSidebarIconActivo(sistemaId);
    this.rutaExplorador.set(carpetas);
    this.shell.setContenidoPendienteSeleccion(true);
    this.actualizarUrlExplorador();
  }

  /** Refleja el estado del explorador en la barra del navegador de forma cosmética. */
  actualizarUrlExplorador(): void {
    const sistemaId = this.shell.sidebarIconActivo();
    if (!sistemaId) return;
    
    const sistema = this.iconos().find(i => i.id === sistemaId);
    if (!sistema) return;

    // Convertir las etiquetas de las carpetas en segmentos URL (ej. "Avance Comercial" -> "avance-comercial")
    const segmentos = this.rutaExplorador().map(n => this.normalizarParaUrl(n.etiqueta));
    const rutaBase = sistema.ruta || `/app/${sistemaId}`;
    
    const path = segmentos.length > 0 ? `${rutaBase}/${segmentos.join('/')}` : rutaBase;
    this.location.replaceState(path);
  }

  private normalizarParaUrl(texto: string): string {
    return texto.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  /** Reconstruye el estado del explorador (módulo y carpetas) a partir de la URL. */
  restaurarDesdeUrl(url: string): void {
    const iconos = this.iconos();
    const sistema = iconos.find((i) => i.ruta && url.startsWith(i.ruta));
    if (!sistema) {
      this.shell.setContenidoPendienteSeleccion(true);
      return;
    }

    this.shell.setSidebarIconActivo(sistema.id);

    const rutaBase = sistema.ruta!;
    const resto = url.substring(rutaBase.length).replace(/^\//, '');
    const segmentosUrl = resto.split('/').filter(Boolean);

    let nodosDisponibles = this.panelDe(sistema.id)?.secciones.flatMap((s) => s.rutas) || [];
    const rutaEncontrada: SidebarNavRuta[] = [];

    for (const segmento of segmentosUrl) {
      const nodo = nodosDisponibles.find((n) => this.normalizarParaUrl(n.etiqueta) === segmento);
      if (!nodo) break;
      rutaEncontrada.push(nodo);
      nodosDisponibles = nodo.hijos || [];
    }

    this.rutaExplorador.set(rutaEncontrada);
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

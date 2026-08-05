import { Component, inject, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import { TooltipModule } from 'primeng/tooltip';
import { MenuStgService } from '../../services/menu-stg.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavSeccion } from '../../interfaces/sidebar.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarNavPanelComponent, TooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  protected readonly shell = inject(ShellStateService);
  private readonly menuStg = inject(MenuStgService);
  private readonly kaypacha = inject(KaypachaService);
  private readonly redirect = inject(RedirectOverlayService);
  private readonly router = inject(Router);

  constructor() {
    // Categorías del ranking, para la sección "Categoría" del panel de ranking-k.
    this.kaypacha.cargarCategorias();
  }

  ngOnInit() {
    const usuario = this.shell.usuarioActivo();
    if (usuario?.email) {
      this.menuStg.cargar(usuario.email);
    }
  }

  protected readonly iconActivoId = this.shell.sidebarIconActivo;

  protected readonly iconos = computed<SidebarIcon[]>(() => {
    const base: SidebarIcon[] = [
      {
        id: 'host-inicio',
        tipo: 'host-inicio',
        icono: 'pi pi-home',
        etiqueta: 'Inicio',
        tienePanel: true,
      },
    ];

    // Sistemas de STG (backend Ant), tal cual los devuelve el backend — sin
    // filtrar ni hardcodear ninguno. Si un ítem apunta a la ruta de un
    // módulo ya migrado del Host (ej. ranking-k), se le habilita panel
    // propio (sección "Categoría") en vez de navegar directo a la ruta.
    const sistemasStg = this.menuStg.sistemas().map((sistema) =>
      sistema.ruta === this.kaypacha.ruta ? { ...sistema, tienePanel: true } : sistema
    );

    return [...base, ...sistemasStg];
  });

  /** `null` cuando el sistema activo no tiene panel — Col 2 se oculta por completo (ver template). */
  protected readonly panelActivo = computed<SidebarNavPanelConfig | null>(() => {
    const id = this.shell.sidebarIconActivo();

    if (id === 'host-inicio') {
      return this.getPanelHost();
    }

    const icono = this.iconos().find(i => i.id === id);
    if (!icono?.tienePanel) return null;

    if (icono.ruta === this.kaypacha.ruta) {
      return this.kaypacha.panelPara(icono.etiqueta, icono.icono);
    }

    return this.getPanelStg(id);
  });

  protected seleccionarIcono(icon: SidebarIcon): void {
    // Siempre se marca activo el ícono clickeado, tenga panel o no: así Col 1
    // resalta el sistema correcto y `panelActivo` oculta Col 2 si no aplica.
    this.shell.setSidebarIconActivo(icon.id);

    const key = (icon.etiqueta || icon.id || '').toLowerCase();
    const ruta = icon.ruta || '';

    // Si el sistema clickeado es un enlace externo (Jira, Imparables, Helpdesk, o URL con http)
    if (key.includes('jira') || key.includes('imparable') || key.includes('helpdesk') || ruta.startsWith('http')) {
      this.redirect.redirigir(icon.etiqueta || icon.id, ruta.startsWith('http') ? ruta : undefined);
      return;
    }

    if (!icon.tienePanel && ruta) {
      this.router.navigateByUrl(ruta).catch(() => {
        console.warn(`Ruta local no encontrada: ${ruta}`);
      });
    }
  }

  protected onRutaSeleccionada(ruta: string): void {
    this.shell.setMenuItemActivo({ ruta, etiqueta: ruta.split('/').pop() ?? '' });

    // En mobile el panel flota sobre el contenido (con fondo oscuro bloqueando
    // el layout, ver template) — al elegir una ruta se oculta solo ahí, para
    // dejar ver la pantalla que recién cargó. En desktop el panel es fijo al
    // costado y debe quedarse abierto para seguir navegando dentro de él.
    if (this.esMobil()) {
      this.shell.setNavPanelColapsado(true);
    }
  }

  /** Breakpoint `sm` de Tailwind (640px) — mismo corte usado en las clases responsive del layout. */
  private esMobil(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  }

  private getPanelHost(): SidebarNavPanelConfig {
    const secciones: SidebarNavSeccion[] = [
      {
        titulo: 'Acceso directo',
        rutas: [
          { etiqueta: 'Mi espacio', ruta: '/app/dashboard', icono: 'lucideGrid' },
        ],
      },
    ];

    return {
      tipo:   'host-admin',
      titulo: 'Host Principal',
      icono:  'pi pi-home',
      secciones: secciones
    };
  }

  /**
   * Solo se llama para sistemas con `tienePanel: true` que vienen de STG
   * (list_sec), es decir, todavía no migrados a un módulo propio del Host.
   */
  private getPanelStg(slug: string): SidebarNavPanelConfig {
    const hijosStg = this.menuStg.hijosPorSistema()[slug] ?? [];
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    const titulo = stg?.etiqueta ?? slug;
    const secciones: SidebarNavSeccion[] = [{ titulo, rutas: hijosStg }];

    return {
      tipo:   'remote',
      titulo,
      icono:  stg?.icono ?? 'pi pi-th-large',
      secciones,
    };
  }
}

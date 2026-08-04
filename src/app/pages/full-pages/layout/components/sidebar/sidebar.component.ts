import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SistemasService } from '../../../../modules/admin/sistemas/services/sistemas.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import { MenuStgService } from '../../services/menu-stg.service';
import { MIS_ICON_PROVIDERS, MIS_ICON_FALLBACK } from '../../../../../shared/constants/mis-icons.constants';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavSeccion } from '../../interfaces/sidebar.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarNavPanelComponent, NgIconComponent],
  viewProviders: [provideIcons({ ...MIS_ICON_PROVIDERS })],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  protected readonly shell = inject(ShellStateService);
  private readonly sistemasService = inject(SistemasService);
  private readonly menuStg = inject(MenuStgService);
  private readonly router = inject(Router);
  protected readonly isNavPanelCollapsed = signal<boolean>(false);

  constructor() {
    // El registro de sistemas alimenta etiquetas e íconos de los remotes
    this.sistemasService.cargarSistemas();
  }

  ngOnInit() {
    const usuario = this.shell.usuarioActivo();
    if (usuario?.email) {
      this.menuStg.cargar(usuario.email);
    }
  }

  protected toggleNavPanel(): void {
    this.isNavPanelCollapsed.update(collapsed => !collapsed);
  }

  protected readonly iconActivoId = this.shell.sidebarIconActivo;

  protected readonly iconos = computed<SidebarIcon[]>(() => {
    const base: SidebarIcon[] = [
      {
        id: 'host-inicio',
        tipo: 'host-inicio',
        icono: 'lucideHome',
        etiqueta: 'Inicio',
        tienePanel: true,
      },
    ];

    const sistemasStg = this.menuStg.sistemas();
    const idsStg = new Set(sistemasStg.map(s => s.id));

    // Remotes registrados en /api/v1/sistemas que todavía no vinieron por STG
    // (evita duplicar un mismo sistema si aparece en ambas fuentes). No hay
    // fuente de nodos para ellos (list_sec es exclusivo de STG), así que no
    // tienen panel — el ícono navega directo al remote, igual que un sistema
    // de STG sin hijos (ver MenuStgService.cargar).
    const remotesRegistrados: SidebarIcon[] = this.shell.subsistemas()
      .filter(slug => !idsStg.has(slug))
      .map(slug => ({
        id:         slug,
        tipo:       'remote' as const,
        icono:      this.getRemoteIcono(slug),
        etiqueta:   this.getRemoteLabel(slug),
        ruta:       `/admin/${slug}`,
        tienePanel: false,
      }));

    return [...base, ...sistemasStg, ...remotesRegistrados];
  });

  /** `null` cuando el sistema activo no tiene panel — Col 2 se oculta por completo (ver template). */
  protected readonly panelActivo = computed<SidebarNavPanelConfig | null>(() => {
    const id = this.shell.sidebarIconActivo();

    if (id === 'host-inicio') {
      return this.getPanelHost();
    }

    const icono = this.iconos().find(i => i.id === id);
    if (!icono?.tienePanel) return null;

    return this.getPanelRemote(id);
  });

  protected seleccionarIcono(icon: SidebarIcon): void {
    // Siempre se marca activo el ícono clickeado, tenga panel o no: así Col 1
    // resalta el sistema correcto y `panelActivo` oculta Col 2 si no aplica.
    this.shell.setSidebarIconActivo(icon.id);

    if (!icon.tienePanel && icon.ruta) {
      this.router.navigateByUrl(icon.ruta);
    }
  }

  protected onRutaSeleccionada(ruta: string): void {
    this.shell.setMenuItemActivo({ ruta, etiqueta: ruta.split('/').pop() ?? '' });
  }

  private getPanelHost(): SidebarNavPanelConfig {
    const secciones: SidebarNavSeccion[] = [
      {
        titulo: 'Acceso directo',
        rutas: [
          { etiqueta: 'Mi espacio', ruta: '/admin/dashboard', icono: 'lucideGrid' },
          { etiqueta: 'Ayuda', ruta: '/admin/help', icono: 'lucideHelpCircle' },
        ],
      },
      {
        titulo: 'Accesos [Admin]',
        rutas: [
          { etiqueta: 'Gestión de usuarios', ruta: '/admin/usuarios', icono: 'lucideUsers',    soloAdminSistema: true },
          { etiqueta: 'Gestión de roles',    ruta: '/admin/roles',    icono: 'lucideActivity', soloAdminSistema: true },
          { etiqueta: 'Gestión de sistemas', ruta: '/admin/sistemas', icono: 'lucideBoxes',    soloAdminSistema: true },
        ],
      },
    ];

    return {
      tipo:   'host-admin',
      titulo: 'Host Principal',
      icono:  'lucideHome',
      secciones: secciones
    };
  }

  /**
   * Solo se llama para sistemas con `tienePanel: true`, es decir, sistemas
   * de STG con nodos reales en `list_sec` (ver `iconos` y `MenuStgService`).
   * Los sistemas sin nodos navegan directo y nunca activan un panel.
   */
  private getPanelRemote(slug: string): SidebarNavPanelConfig {
    const hijosStg = this.menuStg.hijosPorSistema()[slug] ?? [];
    const secciones: SidebarNavSeccion[] = [{ titulo: this.getRemoteLabel(slug), rutas: hijosStg }];

    return {
      tipo:   'remote',
      titulo: this.getRemoteLabel(slug),
      icono:  this.getRemoteIcono(slug),
      secciones,
    };
  }

  private getRemoteLabel(slug: string): string {
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    if (stg) return stg.etiqueta;

    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.nombre ?? slug.replace('subsistema-', '');
  }

  private getRemoteIcono(slug: string): string {
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    if (stg) return stg.icono;

    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.icono ?? MIS_ICON_FALLBACK;
  }
}

import { Component, inject, computed, signal } from '@angular/core';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SistemasService } from '../../../../modules/admin/services/sistemas.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import type { SidebarIcon, SidebarNavPanelConfig } from '../../interfaces/sidebar.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarNavPanelComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  protected readonly shell = inject(ShellStateService);
  private readonly sistemasService = inject(SistemasService);
  protected readonly isNavPanelCollapsed = signal<boolean>(false);

  constructor() {
    // El registro de sistemas alimenta etiquetas e íconos de los remotes
    this.sistemasService.cargarSistemas();
  }

  protected toggleNavPanel(): void {
    this.isNavPanelCollapsed.update(collapsed => !collapsed);
  }

  protected readonly iconActivoId = this.shell.sidebarIconActivo;

  protected readonly iconos = computed<SidebarIcon[]>(() => {
    const remotes = this.shell.subsistemas();

    const base: SidebarIcon[] = [
      {
        id: 'host-inicio',
        tipo: 'host-inicio',
        icono: 'pi pi-home',
        etiqueta: 'Inicio',
        tienePanel: true,
      },
    ];

    const remotesIconos: SidebarIcon[] = remotes.map(slug => ({
      id:         slug,
      tipo:       'remote' as const,
      icono:      this.getRemoteIcono(slug),
      etiqueta:   this.getRemoteLabel(slug),
      tienePanel: true,
    }));

    return [...base, ...remotesIconos];
  });

  protected readonly panelActivo = computed<SidebarNavPanelConfig | null>(() => {
    const id = this.shell.sidebarIconActivo();

    if (id === 'host-inicio') {
      return this.getPanelHost();
    }

    return this.getPanelRemote(id);
  });

  protected seleccionarIcono(icon: SidebarIcon): void {
    this.shell.setSidebarIconActivo(icon.id);
  }

  protected onRutaSeleccionada(ruta: string): void {
    this.shell.setMenuItemActivo({ ruta, etiqueta: ruta.split('/').pop() ?? '' });
  }

  private getPanelHost(): SidebarNavPanelConfig {
    return {
      tipo:   'host-admin',
      titulo: 'Host Principal',
      icono:  'lucideHome',
      secciones: [
        {
          titulo: 'Acceso directo',
          rutas: [
            { etiqueta: 'Mi espacio', ruta: '/inicio/dashboard', icono: 'lucideGrid' },
          ],
        },
        // SB-04: opciones de administración bajo la sección "Accesos [Admin]"
        {
          titulo: 'Accesos [Admin]',
          rutas: [
            { etiqueta: 'Gestión de usuarios', ruta: '/admin/usuarios', icono: 'lucideUsers',    soloAdminSistema: true },
            { etiqueta: 'Gestión de roles',    ruta: '/admin/roles',    icono: 'lucideActivity', soloAdminSistema: true },
            { etiqueta: 'Gestión de sistemas', ruta: '/admin/sistemas', icono: 'lucideBoxes',    soloAdminSistema: true },
          ],
        },
      ],
    };
  }

  private getPanelRemote(slug: string): SidebarNavPanelConfig {
    return {
      tipo:   'remote',
      titulo: this.getRemoteLabel(slug),
      icono:  this.getRemoteIcono(slug),
      secciones: [
        {
          titulo: 'Acceso directo',
          rutas: [
            { etiqueta: 'Dashboard', ruta: `/${slug}/dashboard`, icono: 'lucideGrid' },
          ],
        },
        {
          titulo: this.getRemoteLabel(slug),
          rutas: [
            { etiqueta: 'Módulo principal', ruta: `/${slug}`, icono: 'lucideActivity' },
          ],
        },
      ],
    };
  }

  private getRemoteLabel(slug: string): string {
    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.nombre ?? slug.replace('subsistema-', '');
  }

  private getRemoteIcono(slug: string): string {
    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.icono ?? 'pi pi-th-large';
  }
}

import { Component, inject, computed, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideHome, lucideBarChart2, lucideUsers,
  lucideTruck, lucideActivity, lucideGrid, lucideMenu,
} from '@ng-icons/lucide';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import type { SidebarIcon, SidebarNavPanelConfig } from '../../interfaces/sidebar.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgIconComponent, SidebarNavPanelComponent],
  viewProviders: [provideIcons({
    lucideHome, lucideBarChart2, lucideUsers,
    lucideTruck, lucideActivity, lucideGrid, lucideMenu,
  })],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  protected readonly shell = inject(ShellStateService);
  protected readonly isNavPanelCollapsed = signal<boolean>(false);

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
        icono: 'lucideHome',
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
      titulo: 'Sistema Principal (MIS)',
      icono:  'lucideHome',
      secciones: [
        {
          titulo: 'Acceso directo',
          rutas: [
            { etiqueta: 'Dashboard', ruta: '/admin/dashboard', icono: 'lucideGrid' },
          ],
        },
        {
          titulo: 'Administración',
          rutas: [
            { etiqueta: 'Catálogos', ruta: '/admin/catalogos', icono: 'lucideGrid', soloAdmin: true },
          ],
        },
        {
          titulo: 'Accesos',
          rutas: [
            { etiqueta: 'Usuarios',  ruta: '/admin/accesos/usuarios', icono: 'lucideUsers',  soloAdminSistema: true },
            { etiqueta: 'Roles',     ruta: '/admin/accesos/roles',    icono: 'lucideActivity', soloAdminSistema: true },
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
            { etiqueta: 'Dashboard', ruta: `/admin/${slug}/dashboard`, icono: 'lucideGrid' },
          ],
        },
        {
          titulo: this.getRemoteLabel(slug),
          rutas: [
            { etiqueta: 'Módulo principal', ruta: `/admin/${slug}`, icono: 'lucideActivity' },
          ],
        },
      ],
    };
  }

  private getRemoteLabel(slug: string): string {
    const labels: Record<string, string> = {
      'subsistema-contabilidad': 'Contabilidad',
      'subsistema-rrhh':         'RRHH',
      'subsistema-ventas':       'Ventas',
      'subsistema-logistica':    'Logística',
    };
    return labels[slug] ?? slug.replace('subsistema-', '');
  }

  private getRemoteIcono(slug: string): string {
    const iconos: Record<string, string> = {
      'subsistema-contabilidad': 'lucideBarChart2',
      'subsistema-rrhh':         'lucideUsers',
      'subsistema-ventas':       'lucideActivity',
      'subsistema-logistica':    'lucideTruck',
    };
    return iconos[slug] ?? 'lucideGrid';
  }
}

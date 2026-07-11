import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideHome, lucideChevronRight, lucideLayoutDashboard,
  lucideFolder, lucideUsers, lucideShield, lucideExternalLink
} from '@ng-icons/lucide';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { SidebarNavPanelConfig, SidebarNavRuta } from '../../interfaces/sidebar.model';

@Component({
  selector: 'app-sidebar-nav-panel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIconComponent],
  viewProviders: [provideIcons({
    lucideHome, lucideChevronRight, lucideLayoutDashboard,
    lucideFolder, lucideUsers, lucideShield, lucideExternalLink
  })],
  templateUrl: './sidebar-nav-panel.component.html',
  styleUrl: './sidebar-nav-panel.component.css',
})
export class SidebarNavPanelComponent {
  private readonly shell = inject(ShellStateService);

  readonly panelConfig    = input<SidebarNavPanelConfig | null>(null);
  readonly rutaSeleccionada = output<string>();

  seccionRutasVisibles(seccion: SidebarNavPanelConfig['secciones'][0]) {
    return seccion.rutas.filter((ruta: SidebarNavRuta) => {
      if (ruta.soloAdminSistema && !this.shell.esAdminSistema()) return false;
      if (ruta.soloAdmin && !this.shell.esAdmin()) return false;
      return true;
    });
  }
}

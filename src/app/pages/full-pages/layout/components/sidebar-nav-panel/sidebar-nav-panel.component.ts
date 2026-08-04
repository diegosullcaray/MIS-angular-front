import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideGrid, lucideUsers, lucideActivity, lucideBoxes, lucideHelpCircle } from '@ng-icons/lucide';
import { SidebarNavItemComponent } from '../sidebar-nav-item/sidebar-nav-item.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { SidebarNavPanelConfig, SidebarNavRuta } from '../../interfaces/sidebar.model';

@Component({
  selector: 'app-sidebar-nav-panel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIconComponent, SidebarNavItemComponent],
  viewProviders: [provideIcons({ lucideGrid, lucideUsers, lucideActivity, lucideBoxes, lucideHelpCircle })],
  templateUrl: './sidebar-nav-panel.component.html',
  styleUrl: './sidebar-nav-panel.component.css',
})
export class SidebarNavPanelComponent {
  private readonly shell = inject(ShellStateService);

  /** El padre solo renderiza este componente cuando hay un panel activo. */
  readonly panelConfig    = input.required<SidebarNavPanelConfig>();
  readonly rutaSeleccionada = output<string>();

  /** Un solo nodo expandido por nivel de profundidad — ver sidebar-nav-item. */
  protected readonly currentExpandedIndex = signal<number[]>([]);

  constructor() {
    // Al cambiar de sistema, ningún nodo debería seguir expandido del estado anterior.
    effect(() => {
      this.panelConfig();
      this.currentExpandedIndex.set([]);
    });
  }

  protected readonly secciones = computed(() => {
    const cfg = this.panelConfig();

    return cfg.secciones.map((seccion) => ({
      titulo: seccion.titulo,
      rutasVisibles: this.filtrarVisibles(seccion.rutas),
      // El árbol de STG (profundidad arbitraria) se renderiza con el
      // componente recursivo; las secciones del Host siguen como lista plana.
      esArbol: cfg.tipo === 'remote',
    }));
  });

  private filtrarVisibles(rutas: SidebarNavRuta[]): SidebarNavRuta[] {
    return rutas.filter((ruta) => {
      if (ruta.soloAdminSistema && !this.shell.esAdminSistema()) return false;
      if (ruta.soloAdmin && !this.shell.esAdmin()) return false;
      return true;
    });
  }

  /** Expande/colapsa un nodo del árbol; colapsa cualquier rama abierta debajo de él. */
  protected handleExpandChange(event: { depth: number; index: number }): void {
    this.currentExpandedIndex.update((actual) => {
      const nuevo = actual.slice(0, event.depth + 1);
      nuevo[event.depth] = actual[event.depth] === event.index ? -1 : event.index;
      return nuevo;
    });
  }
}

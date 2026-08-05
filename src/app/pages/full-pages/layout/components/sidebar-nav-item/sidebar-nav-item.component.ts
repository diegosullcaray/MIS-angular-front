import { Component, input, output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { SidebarNavRuta } from '../../interfaces/sidebar.model';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';

/**
 * Nodo recursivo del árbol de navegación de STG (Col 2 del sidebar).
 */
@Component({
  selector: 'app-sidebar-nav-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SidebarNavItemComponent],
  templateUrl: './sidebar-nav-item.component.html',
  styleUrl: './sidebar-nav-item.component.css',
})
export class SidebarNavItemComponent {
  private readonly redirect = inject(RedirectOverlayService);

  readonly ruta                 = input.required<SidebarNavRuta>();
  readonly depth                = input<number>(0);
  readonly index                = input<number>(0);
  readonly expanded             = input<boolean>(false);
  readonly currentExpandedIndex = input<number[]>([]);

  readonly expandChange     = output<{ depth: number; index: number }>();
  readonly rutaSeleccionada = output<string>();

  protected get esGrupo(): boolean {
    return !!this.ruta().hijos?.length;
  }

  protected onClick(event: Event): void {
    if (this.esGrupo) {
      event.preventDefault();
      this.expandChange.emit({ depth: this.depth(), index: this.index() });
      return;
    }

    const etiqueta = (this.ruta().etiqueta || '').toLowerCase();
    const ruta = this.ruta().ruta || '';

    // Si es un enlace externo (Imparables, Jira, o URL http)
    if (etiqueta.includes('imparable') || etiqueta.includes('jira') || ruta.startsWith('http')) {
      event.preventDefault();
      this.redirect.redirigir(this.ruta().etiqueta, ruta.startsWith('http') ? ruta : undefined);
      return;
    }

    if (ruta) this.rutaSeleccionada.emit(ruta);
  }

  protected onExpandChangeHijo(event: { depth: number; index: number }): void {
    this.expandChange.emit(event);
  }

  protected onRutaSeleccionadaHijo(ruta: string): void {
    this.rutaSeleccionada.emit(ruta);
  }
}

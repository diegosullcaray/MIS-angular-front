import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { SidebarNavRuta } from '../../interfaces/sidebar.model';

/**
 * Nodo recursivo del árbol de navegación de STG (Col 2 del sidebar).
 *
 * Estructurado como el ejemplo de referencia en `docs/recursos/sidebar-item`:
 * un componente standalone que se importa a sí mismo para renderizar
 * profundidad arbitraria, con expand/collapse de un solo nodo por nivel
 * (`currentExpandedIndex[depth]`), delegado al padre para que todo el árbol
 * comparta un único estado. El resaltado sigue el mismo criterio que la
 * referencia: solo el ítem realmente activo (`routerLinkActive`) se destaca;
 * los grupos ancestro no llevan un estado visual propio.
 */
@Component({
  selector: 'app-sidebar-nav-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SidebarNavItemComponent],
  templateUrl: './sidebar-nav-item.component.html',
  styleUrl: './sidebar-nav-item.component.css',
})
export class SidebarNavItemComponent {
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
    const ruta = this.ruta().ruta;
    if (ruta) this.rutaSeleccionada.emit(ruta);
  }

  protected onExpandChangeHijo(event: { depth: number; index: number }): void {
    this.expandChange.emit(event);
  }

  protected onRutaSeleccionadaHijo(ruta: string): void {
    this.rutaSeleccionada.emit(ruta);
  }
}

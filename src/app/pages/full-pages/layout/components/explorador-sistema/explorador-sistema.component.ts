import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { BuscadorComponent } from '../../../../../shared/ui/buscador/buscador.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import type { SidebarNavRuta } from '../../interfaces/sidebar.model';

/** Explorador de archivos del sistema activo — reemplaza al panel de links de la Col 2. */
@Component({
  selector: 'app-explorador-sistema',
  standalone: true,
  imports: [WindowPanelComponent, BuscadorComponent, TooltipModule, NgTemplateOutlet],
  templateUrl: './explorador-sistema.component.html',
})
export class ExploradorSistemaComponent {
  private readonly navegacion = inject(NavegacionSistemasService);
  private readonly shell = inject(ShellStateService);
  private readonly router = inject(Router);

  protected readonly panel = this.navegacion.panelActivo;
  protected readonly vista = signal<'cuadricula' | 'lista'>('cuadricula');

  /** Carpetas primero y, dentro de cada grupo, alfabético — como el explorador de Windows. */
  protected readonly nodosVisibles = computed<SidebarNavRuta[]>(() =>
    [...this.navegacion.nodosActuales()].sort(
      (a, b) => Number(this.esCarpeta(b)) - Number(this.esCarpeta(a)) || a.etiqueta.localeCompare(b.etiqueta, 'es')
    )
  );

  protected esCarpeta(nodo: SidebarNavRuta): boolean {
    return (nodo.hijos?.length ?? 0) > 0;
  }

  /** Entra a la carpeta, o abre la pantalla si el nodo es una hoja. */
  protected abrir(nodo: SidebarNavRuta): void {
    if (this.esCarpeta(nodo)) {
      this.navegacion.entrarCarpeta(nodo);
      return;
    }
    if (!nodo.ruta) return;

    this.shell.setMenuItemActivo({ ruta: nodo.ruta, etiqueta: nodo.etiqueta });
    this.shell.setContenidoPendienteSeleccion(false);
    this.router.navigateByUrl(nodo.ruta).catch(() => {});
  }
}

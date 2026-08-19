import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { BuscadorComponent } from '../../../../../shared/buscador/buscador.component';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import type { SidebarNavRuta } from '../../interfaces/sidebar.model';

/** Un nivel de la ruta actual del explorador; `-1` es la raíz del sistema. */
interface MigaExplorador {
  etiqueta: string;
  indice: number;
}

/**
 * Explorador de archivos del sistema activo — reemplaza al panel de links de
 * la Col 2. Las ramas del árbol son carpetas en las que se entra y las hojas
 * son reportes que abren su pantalla.
 *
 * La ruta se muestra en dos lugares a la vez, sin que se pisen: acá adentro
 * (siempre visible, es la única forma de subir de nivel en mobile, donde el
 * breadcrumb del header se oculta por espacio) y en el breadcrumb del header
 * (útil al estar viendo un reporte ya abierto, para volver a la carpeta de
 * la que salió — ver `HeaderComponent.breadcrumbRemote`).
 */
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

  /** Migas de la ruta actual — solo se usan en mobile (ver template): en desktop esa misma ruta ya vive en el breadcrumb del header. */
  protected readonly migas = computed<MigaExplorador[]>(() => [
    { etiqueta: this.panel()?.titulo ?? '', indice: -1 },
    ...this.navegacion.rutaExplorador().map((carpeta, i) => ({ etiqueta: carpeta.etiqueta, indice: i })),
  ]);

  protected esCarpeta(nodo: SidebarNavRuta): boolean {
    return (nodo.hijos?.length ?? 0) > 0;
  }

  protected irANivel(indice: number): void {
    this.navegacion.irANivel(indice);
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
    this.router.navigateByUrl(nodo.ruta).catch((err) => console.warn(`Ruta no encontrada: ${nodo.ruta}`, err));
  }

}

import { Component, computed, inject, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PreferenciasService } from '../../../../full-pages/layout/services/preferencias.service';
import { NovedadesTourService } from '../../services/novedades-tour.service';

/** Cuántas novedades se nombran en la bienvenida; el resto está en el panel. */
const DESTACADAS = 4;

/**
 * La bienvenida de Pachi: el saludo del sistema nuevo, con lo que cambió.
 *
 * Vive en el Home y no en el shell a propósito. `LoginComponent` navega a
 * `/app/dashboard`, así que toda sesión empieza acá, y de este modo el diálogo
 * lee el catálogo de novedades directo, sin que una pantalla del layout tenga
 * que importar de un módulo. La contrapartida, asumida: quien entre por enlace
 * directo a un reporte la verá recién al pasar por el Home.
 *
 * Se da **una sola vez**: al cerrarla queda marcada en las preferencias.
 */
@Component({
  selector: 'app-bienvenida-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: './bienvenida-dialog.component.html',
  styleUrl: './bienvenida-dialog.component.css',
})
export class BienvenidaDialogComponent {
  private readonly preferencias = inject(PreferenciasService);
  private readonly tours = inject(NovedadesTourService);

  /** Lo pide el botón "Ver las novedades": el Home abre el panel. */
  readonly verNovedades = output<void>();

  /** Se abre sola si nunca se cerró. */
  private readonly _abierto = signal(!this.preferencias.bienvenida().vista);
  readonly abierto = this._abierto.asReadonly();

  protected readonly destacadas = computed(() => this.tours.novedades.slice(0, DESTACADAS));

  protected cerrar(): void {
    this._abierto.set(false);
    this.preferencias.marcarBienvenidaVista();
  }

  protected irANovedades(): void {
    this.cerrar();
    this.verNovedades.emit();
  }
}

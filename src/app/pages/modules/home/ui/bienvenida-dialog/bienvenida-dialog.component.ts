import { Component, inject, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PreferenciasService } from '../../../../full-pages/layout/services/preferencias.service';
import { NovedadesTourService } from '../../services/novedades-tour.service';

/**
 * La bienvenida de Pachi: el saludo del sistema nuevo, con lo que cambió.
 *
 * Vive en el Home y no en el shell a propósito. `LoginComponent` navega a
 * `/app/dashboard`, así que toda sesión empieza acá.
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
  protected readonly novedadDestacada = inject(NovedadesTourService).novedades[0];

  /** Lo pide el botón "Ver las novedades": el Home abre el panel. */
  readonly verNovedades = output<void>();
  /** "Entrar directo" deja el escritorio despejado y repliega novedades. */
  readonly entrarDirecto = output<void>();

  /** Se abre sola si nunca se cerró. */
  private readonly _abierto = signal(!this.preferencias.bienvenida().vista);
  readonly abierto = this._abierto.asReadonly();

  protected cerrar(): void {
    this._abierto.set(false);
    this.preferencias.marcarBienvenidaVista();
  }

  protected irANovedades(): void {
    this.cerrar();
    this.verNovedades.emit();
  }

  protected entrar(): void {
    this.cerrar();
    this.entrarDirecto.emit();
  }
}

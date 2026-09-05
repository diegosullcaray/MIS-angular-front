import { Component, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AnunciosService } from '../../../../../../core/preferencias/aplicacion/anuncios.service';

/**
 * Diálogo del comunicado. Muestra la pieza tal como la publica Comunicación
 * Interna: una sola imagen, sin recorrido ni paginación — hay un comunicado
 * vigente a la vez.
 *
 * Se abre solo cuando `AnunciosService` dice que hay algo pendiente —esa es la
 * corrección al aviso que salía en cada inicio de sesión— y también a pedido,
 * desde el botón de comunicados del header. Cerrarlo lo da por leído.
 */
@Component({
  selector: 'app-anuncios-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: './anuncios-dialog.component.html',
  styleUrl: './anuncios-dialog.component.css',
})
export class AnunciosDialogComponent {
  protected readonly anuncios = inject(AnunciosService);

  protected readonly comunicado = this.anuncios.comunicado;

  protected cerrar(): void {
    this.anuncios.cerrar();
  }

  protected silenciar(): void {
    this.anuncios.silenciar();
  }
}

import { Component, computed, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AnunciosService } from '../../../../../../core/preferencias/aplicacion/anuncios.service';
import { etiquetaSeveridad, severidadPrimeNg } from '../../../../../../core/preferencias/dominio/anuncio.model';
import type { Anuncio } from '../../../../../../core/preferencias/dominio/anuncio.model';

/**
 * Diálogo de anuncios del sistema.
 *
 * Se abre solo cuando `AnunciosService` dice que hay algo pendiente —esa es la
 * corrección al aviso que aparecía en cada inicio de sesión— y también a pedido,
 * desde la campana del header. Cerrarlo da por leídos los anuncios que mostró.
 */
@Component({
  selector: 'app-anuncios-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, TagModule],
  templateUrl: './anuncios-dialog.component.html',
  styleUrl: './anuncios-dialog.component.css',
})
export class AnunciosDialogComponent {
  protected readonly anuncios = inject(AnunciosService);

  /**
   * Sin nada pendiente el diálogo no se abre solo, pero desde la campana sí:
   * en ese caso muestra el historial, que si no quedaría vacío.
   */
  protected readonly listado = computed<readonly Anuncio[]>(() => {
    const pendientes = this.anuncios.pendientes();
    return pendientes.length > 0 ? pendientes : this.anuncios.historial();
  });

  protected readonly soloHistorial = computed(() => this.anuncios.pendientes().length === 0);

  protected readonly etiqueta = etiquetaSeveridad;
  protected readonly severidad = severidadPrimeNg;

  protected cerrar(): void {
    this.anuncios.cerrar();
  }

  protected silenciar(): void {
    this.anuncios.silenciar();
  }
}

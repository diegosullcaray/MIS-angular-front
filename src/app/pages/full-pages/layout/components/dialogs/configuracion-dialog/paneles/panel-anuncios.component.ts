import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AnunciosService } from '../../../../../../../core/preferencias/aplicacion/anuncios.service';
import { PreferenciasService } from '../../../../../../../core/preferencias/aplicacion/preferencias.service';
import {
  etiquetaSeveridad,
  severidadPrimeNg,
} from '../../../../../../../core/preferencias/dominio/anuncio.model';

/**
 * Pantalla "Anuncios": el control del usuario sobre el diálogo que antes salía
 * en cada inicio de sesión. Desde acá se apagan del todo, se vuelven a
 * habilitar los ya leídos, y se relee lo publicado.
 */
@Component({
  selector: 'app-panel-anuncios',
  standalone: true,
  imports: [FormsModule, ButtonModule, TagModule, ToggleSwitchModule],
  templateUrl: './panel-anuncios.component.html',
  styleUrl: './paneles.css',
})
export class PanelAnunciosComponent {
  private readonly preferencias = inject(PreferenciasService);
  protected readonly anuncios = inject(AnunciosService);

  protected readonly silenciados = this.preferencias.anuncios;

  protected readonly etiqueta = etiquetaSeveridad;
  protected readonly severidad = severidadPrimeNg;

  protected setSilenciar(valor: boolean): void {
    this.preferencias.setSilenciarAnuncios(valor);
  }

  protected reiniciar(): void {
    this.preferencias.reiniciarAnuncios();
  }
}

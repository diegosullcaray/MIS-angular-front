import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PreferenciasService } from '../../../../../../../core/preferencias/aplicacion/preferencias.service';

/**
 * Pantalla "Anuncios": el único control del usuario sobre los comunicados es
 * verlos o no al entrar. La lectura sigue estando en el botón de comunicados
 * del header, así que el panel no repite ni el estado ni la pieza publicada.
 *
 * No se confunde con "Notificaciones", que es otro ajuste: los comunicados son
 * las piezas que publica Comunicación Interna; las notificaciones son los
 * avisos que genera el sistema por la actividad del usuario.
 */
@Component({
  selector: 'app-panel-anuncios',
  standalone: true,
  imports: [FormsModule, ToggleSwitchModule],
  templateUrl: './panel-anuncios.component.html',
  styleUrl: './paneles.css',
})
export class PanelAnunciosComponent {
  private readonly preferencias = inject(PreferenciasService);

  protected readonly ajustes = this.preferencias.anuncios;

  protected setSilenciar(valor: boolean): void {
    this.preferencias.setSilenciarAnuncios(valor);
  }
}

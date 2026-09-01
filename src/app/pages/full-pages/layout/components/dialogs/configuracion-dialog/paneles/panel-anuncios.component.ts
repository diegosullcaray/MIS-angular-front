import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AnunciosService } from '../../../../../../../core/preferencias/aplicacion/anuncios.service';
import { PreferenciasService } from '../../../../../../../core/preferencias/aplicacion/preferencias.service';

/**
 * Pantalla "Anuncios": el control del usuario sobre los comunicados que antes
 * salían en cada inicio de sesión. Desde acá se apagan del todo, se vuelven a
 * habilitar los ya leídos y se relee lo publicado.
 *
 * No se confunde con "Notificaciones", que es otro ajuste: los comunicados son
 * las piezas que publica Comunicación Interna; las notificaciones son los
 * avisos que genera el sistema por la actividad del usuario.
 */
@Component({
  selector: 'app-panel-anuncios',
  standalone: true,
  imports: [FormsModule, ButtonModule, ToggleSwitchModule],
  templateUrl: './panel-anuncios.component.html',
  styleUrl: './paneles.css',
})
export class PanelAnunciosComponent {
  private readonly preferencias = inject(PreferenciasService);
  protected readonly anuncios = inject(AnunciosService);

  protected readonly ajustes = this.preferencias.anuncios;

  protected setSilenciar(valor: boolean): void {
    this.preferencias.setSilenciarAnuncios(valor);
  }

  protected reiniciar(): void {
    this.preferencias.reiniciarAnuncios();
  }

  /** Abre el visor en el comunicado elegido — el mismo diálogo que sale al entrar. */
  protected abrirVisor(): void {
    this.anuncios.abrir();
  }
}

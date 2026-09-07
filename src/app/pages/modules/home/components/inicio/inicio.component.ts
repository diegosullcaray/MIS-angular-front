import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { PreferenciasService } from '../../../../../core/preferencias/aplicacion/preferencias.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, WindowPanelComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  private readonly preferencias = inject(PreferenciasService);

  /** Los últimos reportes abiertos, del más reciente al más antiguo. */
  protected readonly recientes = this.preferencias.recientes;

  /**
   * Antigüedad en palabras: en un acceso rápido importa "qué tan reciente",
   * no la hora exacta. Pasada una semana ya conviene la fecha.
   */
  protected desde(fechaVisita: number): string {
    const minutos = Math.floor((Date.now() - fechaVisita) / 60_000);
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;

    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;

    return new Date(fechaVisita).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}

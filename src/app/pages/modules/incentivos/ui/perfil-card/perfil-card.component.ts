import { Component, computed, inject, output } from '@angular/core';
import { IncentivosService } from '../../services/incentivos.service';
import { MonetizadoCardComponent } from '../monetizado-card/monetizado-card.component';

/** Tarjeta de perfil y semáforo del Cuadro de Mando. */
@Component({
  selector: 'app-perfil-card',
  standalone: true,
  imports: [MonetizadoCardComponent],
  templateUrl: './perfil-card.component.html',
  styleUrl: './perfil-card.component.css',
})
export class PerfilCardComponent {
  protected readonly incentivos = inject(IncentivosService);

  readonly abrirCalculadora = output<void>();

  protected readonly semaforoVisible = computed(() => this.incentivos.semaforo().filter((s) => s.show));

  /** Color del ícono — `getIconCls()` del legado: 0 rojo (`.dm`), 1 verde (`.am`), otro gris (`.nm`). */
  protected colorEstado(valor: number): string {
    if (valor === 0) return 'var(--mis-inc-semaforo-mal)';
    if (valor === 1) return 'var(--mis-inc-semaforo-bien)';
    return 'var(--mis-inc-semaforo-neutro)';
  }

  /** Estado en palabras, para el tooltip y los lectores de pantalla (el color solo no basta). */
  protected estadoTexto(valor: number): string {
    if (valor === 0) return 'no cumple';
    if (valor === 1) return 'cumple';
    return 'sin evaluar';
  }
}

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

  readonly abrirSelector = output<void>();
  readonly abrirCalculadora = output<void>();

  protected readonly semaforoVisible = computed(() => this.incentivos.semaforo().filter((s) => s.show));

  protected claseIcono(valor: number): string {
    if (valor === 0) return 'text-[var(--mis-danger)]';
    if (valor === 1) return 'text-[var(--mis-warning)]';
    return 'text-[var(--mis-success)]';
  }
}

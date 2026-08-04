import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { ButtonModule } from 'primeng/button';
import { ToastService } from '../../../../../shared/services/toast.service';

/** Criterio de filtrado aplicado sobre las filas de una categoría del ranking. */
export interface RankingFiltros {
  usuario: string;
  puntosMin: number;
  puntosMax: number;
  lugares: string[];
}

/**
 * Panel de filtros del reporte de ranking (`categoria-detalle`) — filtra por
 * usuario, rango de puntos y lugar (`hdester`). Solo se dispara al hacer
 * clic en "Aplicar filtros" (no en vivo mientras se editan los controles),
 * y notifica con un toast, igual que pide el diseño.
 */
@Component({
  selector: 'app-ranking-filtros',
  standalone: true,
  imports: [FormsModule, InputTextModule, MultiSelectModule, SliderModule, ButtonModule],
  templateUrl: './ranking-filtros.component.html',
  styleUrl: './ranking-filtros.component.css',
})
export class RankingFiltrosComponent {
  private readonly toast = inject(ToastService);

  readonly lugaresDisponibles = input<string[]>([]);
  readonly puntosMinDisponible = input(0);
  readonly puntosMaxDisponible = input(100);

  readonly aplicarFiltros = output<RankingFiltros>();

  protected readonly usuario = signal('');
  protected readonly lugares = signal<string[]>([]);
  protected readonly rangoPuntos = signal<[number, number]>([0, 100]);

  constructor() {
    // Cuando llegan/cambian los límites reales de la data, reinicia el rango
    // y preselecciona todos los lugares — sin esto, el slider queda con los
    // valores por defecto (0-100) que no reflejan la data real.
    effect(() => {
      const min = this.puntosMinDisponible();
      const max = this.puntosMaxDisponible();
      const lugares = this.lugaresDisponibles();
      untracked(() => {
        this.rangoPuntos.set([min, max]);
        this.lugares.set([...lugares]);
      });
    });
  }

  protected onAplicar(): void {
    this.aplicarFiltros.emit({
      usuario: this.usuario().trim(),
      puntosMin: this.rangoPuntos()[0],
      puntosMax: this.rangoPuntos()[1],
      lugares: this.lugares(),
    });
    this.toast.exito('Filtros aplicados');
  }

  protected onLimpiar(): void {
    this.usuario.set('');
    this.rangoPuntos.set([this.puntosMinDisponible(), this.puntosMaxDisponible()]);
    this.lugares.set([...this.lugaresDisponibles()]);
    this.onAplicar();
  }
}

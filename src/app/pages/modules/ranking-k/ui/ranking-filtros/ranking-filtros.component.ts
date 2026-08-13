import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { ButtonModule } from 'primeng/button';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { RankingFiltros, FiltrosFormModel } from '../../models/ranking-filtros.model';

/** Panel de filtros del ranking. */
@Component({
  selector: 'app-ranking-filtros',
  standalone: true,
  imports: [FormField, FormsModule, InputTextModule, MultiSelectModule, SelectModule, SliderModule, ButtonModule],
  templateUrl: './ranking-filtros.component.html',
  styleUrl: './ranking-filtros.component.css',
})
export class RankingFiltrosComponent {
  private readonly toast = inject(ToastService);

  readonly lugaresDisponibles = input<string[]>([]);
  readonly puntosMinDisponible = input(0);
  readonly puntosMaxDisponible = input(100);

  readonly aplicarFiltros = output<RankingFiltros>();

  protected readonly opcionesPosiciones = [
    { label: 'Top 10', value: 10 },
    { label: 'Top 20', value: 20 },
    { label: 'Top 50', value: 50 },
    { label: 'Top 100', value: 100 },
    { label: 'Todas las posiciones', value: 0 },
  ];

  protected readonly model = signal<FiltrosFormModel>({
    usuario: '',
    lugares: [],
    rangoPuntos: [0, 100],
    limitePosiciones: 0,
  });

  protected readonly filtrosForm = form(this.model);

  constructor() {
    effect(() => {
      const min = this.puntosMinDisponible();
      const max = this.puntosMaxDisponible();
      const lugares = this.lugaresDisponibles();
      untracked(() => {
        this.model.update((m) => ({
          ...m,
          rangoPuntos: [min, max],
          lugares: [...lugares],
        }));
      });
    });
  }

  protected onLimitePosicionesChange(limite: number): void {
    this.model.update((m) => ({ ...m, limitePosiciones: limite }));
  }

  protected onLugaresChange(lugares: string[]): void {
    this.model.update((m) => ({ ...m, lugares }));
  }

  protected onRangoPuntosChange(rango: [number, number]): void {
    this.model.update((m) => ({ ...m, rangoPuntos: rango }));
  }

  protected onAplicar(): void {
    this.emitirYCerrar('Los filtros fueron aplicados correctamente', true);
  }

  protected onLimpiar(): void {
    this.model.set({
      usuario: '',
      rangoPuntos: [this.puntosMinDisponible(), this.puntosMaxDisponible()],
      lugares: [...this.lugaresDisponibles()],
      limitePosiciones: 0,
    });
    this.emitirYCerrar('Los filtros fueron restablecidos', false);
  }

  private emitirYCerrar(mensaje: string, esExito: boolean): void {
    const val = this.model();
    this.aplicarFiltros.emit({
      usuario: val.usuario.trim(),
      puntosMin: val.rangoPuntos[0],
      puntosMax: val.rangoPuntos[1],
      lugares: val.lugares,
      limitePosiciones: val.limitePosiciones,
    });
    if (esExito) {
      this.toast.exito('Mensaje de éxito', mensaje);
    } else {
      this.toast.info('Mensaje de información', mensaje);
    }
  }
}

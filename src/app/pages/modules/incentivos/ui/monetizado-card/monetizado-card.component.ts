import { Component, computed, inject, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { IncentivosService } from '../../services/incentivos.service';

function aFecha(f: string): Date {
  return new Date(Number(f.slice(0, 4)), Number(f.slice(4, 6)) - 1, Number(f.slice(6, 8)), 12);
}

function aYYYYMMDD(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/** Panel de Monetización de Incentivos. */
@Component({
  selector: 'app-monetizado-card',
  standalone: true,
  imports: [DecimalPipe, FormsModule, DatePickerModule],
  templateUrl: './monetizado-card.component.html',
  styleUrl: './monetizado-card.component.css',
})
export class MonetizadoCardComponent {
  protected readonly incentivos = inject(IncentivosService);

  readonly abrirCalculadora = output<void>();

  private readonly fechasOrdenadas = computed(() => [...this.incentivos.monetizado().fechasHabilitadas].sort());

  protected readonly fechaSeleccionada = computed(() => {
    const f = this.incentivos.fechaActual();
    return f ? aFecha(f) : null;
  });

  protected readonly minDate = computed(() => {
    const fechas = this.fechasOrdenadas();
    return fechas.length ? aFecha(fechas[0]) : undefined;
  });

  protected readonly maxDate = computed(() => {
    const fechas = this.fechasOrdenadas();
    return fechas.length ? aFecha(fechas[fechas.length - 1]) : undefined;
  });

  protected readonly disabledDates = computed(() => {
    const habilitadas = new Set(this.fechasOrdenadas());
    const min = this.minDate();
    const max = this.maxDate();
    if (!min || !max) return [];

    const deshabilitadas: Date[] = [];
    for (const cursor = new Date(min); cursor <= max; cursor.setDate(cursor.getDate() + 1)) {
      if (!habilitadas.has(aYYYYMMDD(cursor))) deshabilitadas.push(new Date(cursor));
    }
    return deshabilitadas;
  });

  protected onCambioFecha(fecha: Date | null): void {
    if (fecha) this.incentivos.seleccionarFecha(aYYYYMMDD(fecha));
  }

  protected claseBonoSuperPlus(): string {
    return this.incentivos.monetizado().bonoSuperPlus < 0 ? 'text-[var(--mis-danger)]' : '';
  }

  protected claseSituacion(): string {
    return this.incentivos.monetizado().codigoSituacion === 1 ? 'text-[var(--mis-success)]' : 'text-[var(--mis-danger)]';
  }
}

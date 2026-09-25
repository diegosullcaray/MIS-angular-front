import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KnobModule } from 'primeng/knob';
import type { TarjetaCmgCartera } from '../../components/actividad-diaria/components/Cartera/models/cmg-cartera.model';

const ENTERO = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

/**
 * Tarjeta KPI contra meta, con la disposición del legado (*CMG Cartera*):
 *
 * - a la izquierda: el valor grande, debajo la referencia en color primario (meta, TAPP mínima, mes
 *   anterior) y al pie el nombre del indicador;
 * - a la derecha: el aro de cumplimiento, o la variación con su flecha (verde si sube, rojo si baja).
 *
 * El aro recibe su valor ya animado (`progreso`), así el contenedor decide la animación.
 */
@Component({
  selector: 'app-tarjeta-meta',
  standalone: true,
  imports: [FormsModule, KnobModule],
  host: { class: 'block' },
  template: `
    <div class="kpi-card h-full p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-3">
      <div class="flex flex-col gap-1 min-w-0">
        <span class="text-[24px] sm:text-[28px] font-extrabold tracking-tight text-[var(--mis-text-primary)] leading-tight tabular-nums truncate">
          {{ valorTexto() }}
        </span>
        @if (tarjeta().comparativo) {
          <span class="text-[13px] font-medium text-[var(--mis-primary)] tabular-nums truncate">{{ tarjeta().comparativo }}</span>
        }
        <span class="mt-2 text-[12px] font-medium text-[var(--mis-text-secondary)] truncate">{{ tarjeta().etiqueta }}</span>
      </div>

      @if (tarjeta().cumplimiento !== undefined) {
        <p-knob
          class="shrink-0"
          [ngModel]="progreso()"
          readonly
          [size]="64"
          [strokeWidth]="6"
          valueTemplate="{value}%"
          [valueColor]="colorAnillo()"
          rangeColor="var(--mis-border)"
          textColor="var(--mis-text-primary)"
        />
      } @else if (tarjeta().delta && tarjeta().senal !== 0) {
        <span class="shrink-0 flex items-center gap-1 text-[15px] font-bold tabular-nums" [class]="claseVariacion()">
          {{ tarjeta().delta }}
          <i class="pi text-[14px]" [class.pi-arrow-up]="tarjeta().senal > 0" [class.pi-arrow-down]="tarjeta().senal < 0" aria-hidden="true"></i>
        </span>
      }
    </div>
  `,
})
export class TarjetaMetaComponent {
  readonly tarjeta = input.required<TarjetaCmgCartera>();
  /** Valor animado del aro (0 → `cumplimiento`); solo se usa si la tarjeta trae cumplimiento. */
  readonly progreso = input(0);

  protected readonly valorTexto = computed(() => {
    const valor = this.tarjeta().valor;
    if (valor === '' || valor === null || valor === undefined) return '—';
    return Number.isFinite(Number(valor)) ? ENTERO.format(Number(valor)) : String(valor);
  });

  /** Mismos cortes que el legado: rojo bajo 95 %, ámbar hasta 100 %, verde al superar la meta. */
  protected readonly colorAnillo = computed(() => {
    const valor = this.progreso();
    if (valor <= 0) return 'transparent';
    if (valor < 95) return 'var(--mis-danger)';
    if (valor <= 100) return 'var(--mis-warning)';
    return 'var(--mis-success)';
  });

  protected readonly claseVariacion = computed(() =>
    this.tarjeta().senal > 0 ? 'text-[var(--mis-success)]' : 'text-[var(--mis-danger)]',
  );
}

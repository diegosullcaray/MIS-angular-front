import { Component, computed, input } from '@angular/core';

/** Umbrales de la forma compacta — un saldo de cartera se lee mejor como `4.2 M` que como `4,235,891.00`. */
const MILLON = 1_000_000;
const MIL = 1_000;

/**
 * Tarjeta de indicador (KPI): etiqueta, valor y variación contra un periodo con nombre.
 *
 * Sigue el contrato de un *stat tile*: una sola etiqueta, el valor como protagonista en forma
 * compacta, y la variación con signo, flecha y periodo. La flecha importa: el color solo no
 * puede ser el único portador del estado.
 */
@Component({
  selector: 'app-kpi-tile',
  standalone: true,
  imports: [],
  templateUrl: './kpi-tile.component.html',
  styleUrl: './kpi-tile.component.css',
})
export class KpiTileComponent {
  /** Qué mide la tarjeta (ej. `Ahorros`). Sin dos puntos al final. */
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<number>();
  /** Prefijo de unidad del valor (ej. `S/`); vacío para conteos. */
  readonly unidad = input('');
  /** Variación contra el periodo; `null` la oculta. */
  readonly variacion = input<number | null>(null);
  /** Periodo con el que se compara — sin nombrarlo, la variación no significa nada. */
  readonly periodo = input('vs. mes anterior');
  /** Si subir es bueno. En mora, por ejemplo, es al revés. */
  readonly subirEsBueno = input(true);

  /** Valor abreviado: `4.2 M`, `12.9 K`, `1,284`. */
  protected readonly valorCompacto = computed(() => {
    const valor = this.valor();
    if (!Number.isFinite(valor)) return '—';

    const absoluto = Math.abs(valor);
    if (absoluto >= MILLON) return `${this.decimal(valor / MILLON)} M`;
    if (absoluto >= 10 * MIL) return `${this.decimal(valor / MIL)} K`;
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(valor);
  });

  /** Variación con signo explícito: un `+` delante deja claro que es un delta, no un total. */
  protected readonly variacionConSigno = computed(() => {
    const variacion = this.variacion();
    if (variacion === null || !Number.isFinite(variacion)) return '';
    const formateada = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(Math.abs(variacion));
    return `${variacion > 0 ? '+' : variacion < 0 ? '−' : ''}${formateada}`;
  });

  protected readonly sentido = computed<'sube' | 'baja' | 'plano'>(() => {
    const variacion = this.variacion();
    if (variacion === null || !Number.isFinite(variacion) || variacion === 0) return 'plano';
    return variacion > 0 ? 'sube' : 'baja';
  });

  /** Color del delta: lo decide si el movimiento es favorable, no si es hacia arriba. */
  protected readonly claseVariacion = computed(() => {
    const sentido = this.sentido();
    if (sentido === 'plano') return 'text-[var(--mis-text-tertiary)]';
    const favorable = sentido === 'sube' ? this.subirEsBueno() : !this.subirEsBueno();
    return favorable ? 'text-[var(--mis-success)]' : 'text-[var(--mis-danger)]';
  });

  protected readonly iconoVariacion = computed(() => {
    const sentido = this.sentido();
    if (sentido === 'plano') return 'pi-minus';
    return sentido === 'sube' ? 'pi-arrow-up-right' : 'pi-arrow-down-right';
  });

  private decimal(valor: number): string {
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor);
  }
}

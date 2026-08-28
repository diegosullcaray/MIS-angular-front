import { Component, computed, inject, input, output, LOCALE_ID } from '@angular/core';
import { formatNumber, formatPercent } from '@angular/common';
import { TableModule } from 'primeng/table';
import { aplanarEncabezados } from './tabla-dinamica.util';
import type { ColumnaDinamica } from '../models/tabla-dinamica.model';

/** Tabla del motor `table.regular` (columnas dinámicas) — reemplaza a `stg-table2` del legado (`shared/components/stg-table2`). */
@Component({
  selector: 'app-tabla-dinamica',
  standalone: true,
  imports: [TableModule],
  templateUrl: './tabla-dinamica.component.html',
  styleUrl: './tabla-dinamica.component.css',
})
export class TablaDinamicaComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly columnas = input.required<ColumnaDinamica[]>();
  readonly filas = input.required<Record<string, unknown>[]>();
  readonly cargando = input(false);
  /** Pinta en verde/rojo las columnas de variación — legado `aplicarEstilos()` de `carterizacion-cap-com`, que lo aplica a toda clave que contenga `var`. */
  readonly colorearVariaciones = input(false);

  /**
   * Fondo dinámico verde/rojo según el signo del valor — legado
   * `fondoDinamicoFn()` de `gestion-comercial.component.ts`, que lo aplica a
   * TODA columna salvo "Descripción" (a diferencia de `colorearVariaciones`,
   * que solo mira las claves con `var`).
   */
  readonly fondoDinamico = input(false);

  readonly seleccionable = input(false);
  readonly filaSeleccionada = output<Record<string, unknown>>();

  /**
   * Claves de columna que son "clicables" — equivalente al `onClickCell` de
   * `stg-table2` del legado, donde cada reporte decidía qué hacer según
   * `evt.key`.
   *
   * Vacío (por defecto) mantiene el comportamiento de fila entera. Con valores,
   * solo esas celdas responden al clic y emiten `celdaSeleccionada`, que es lo
   * que necesitan los reportes cuyo legado abre cosas distintas por columna.
   */
  readonly columnasClicables = input<readonly string[]>([]);
  readonly celdaSeleccionada = output<{ clave: string; fila: Record<string, unknown> }>();

  protected readonly encabezados = computed(() => aplanarEncabezados(this.columnas()));

  protected valor(fila: Record<string, unknown>, columna: ColumnaDinamica): unknown {
    const crudo = fila[columna.key];
    if (crudo == null || crudo === '') return crudo;

    const tipo = columna.format?.type;
    if (tipo !== 'integer' && tipo !== 'decimal' && tipo !== 'percent') return crudo;

    const numero = Number(crudo);
    // Un porcentaje que ya viene con `%` (texto) no es convertible: se deja tal cual.
    if (Number.isNaN(numero)) return crudo;

    if (tipo === 'percent') return formatPercent(numero, this.locale, '1.2-2');
    return formatNumber(numero, this.locale, tipo === 'integer' ? '1.0-0' : '1.2-2');
  }

  /** Color de la celda cuando es una variación: verde si sube, rojo si baja. */
  protected color(fila: Record<string, unknown>, columna: ColumnaDinamica): string | null {
    if (!this.colorearVariaciones() || !columna.key.toLowerCase().includes('var')) return null;

    const numero = Number(fila[columna.key]);
    if (Number.isNaN(numero) || numero === 0) return null;
    return numero > 0 ? 'var(--mis-success)' : 'var(--mis-danger)';
  }

  /** Con `fondoDinamico`, el signo del valor de esta celda; `null` fuera de rango o en "Descripción". */
  private signoFondoDinamico(fila: Record<string, unknown>, columna: ColumnaDinamica): 1 | -1 | null {
    if (!this.fondoDinamico() || columna.label === 'Descripción') return null;
    const numero = Number(fila[columna.key]);
    if (Number.isNaN(numero) || numero === 0) return null;
    return numero > 0 ? 1 : -1;
  }

  /** Fondo de la celda con `fondoDinamico`: verde claro en positivo, rojo claro en negativo. */
  protected fondoCelda(fila: Record<string, unknown>, columna: ColumnaDinamica): string | null {
    const signo = this.signoFondoDinamico(fila, columna);
    if (!signo) return null;
    return signo > 0 ? 'var(--mis-success-light)' : 'var(--mis-danger-light)';
  }

  /** Texto de la celda con `fondoDinamico`, a juego con su fondo. */
  protected colorFondoDinamico(fila: Record<string, unknown>, columna: ColumnaDinamica): string | null {
    const signo = this.signoFondoDinamico(fila, columna);
    if (!signo) return null;
    return signo > 0 ? 'var(--mis-success)' : 'var(--mis-danger)';
  }

  /** Fila "destacada" del backend (`row.style === 1` en el legado — total/resumen). */
  protected destacada(fila: Record<string, unknown>): boolean {
    return fila['style'] === 1;
  }

  /** Si hay que dibujar el punto de semáforo de esta celda (columna con `semaforoKey` y valor presente en la fila). */
  protected mostrarSemaforo(fila: Record<string, unknown>, columna: ColumnaDinamica): boolean {
    if (!columna.semaforoKey) return false;
    const valor = fila[columna.semaforoKey];
    return valor !== null && valor !== undefined && valor !== '';
  }

  /** Mismos colores que `app-tabla-reporte` (`colorSemaforo`): `1` éxito, `0` alerta, `-1` peligro, cualquier otro valor neutro. */
  protected colorSemaforo(fila: Record<string, unknown>, columna: ColumnaDinamica): string {
    const valor = columna.semaforoKey ? fila[columna.semaforoKey] : undefined;
    const num = Number(valor);
    if (num === 1) return 'text-[var(--mis-success)]';
    if (num === 0) return 'text-orange-500';
    if (num === -1) return 'text-[var(--mis-danger)]';
    return 'text-[var(--mis-text-tertiary)]';
  }

  /**
   * Números pegados a la derecha, texto a la izquierda — misma regla que
   * `app-tabla-reporte`. A diferencia de esa tabla, aquí el semáforo no es una
   * columna aparte: comparte celda con su valor (`semaforoKey`), así que sigue
   * la alineación normal del valor en vez de la angosta y centrada.
   */
  protected alineacion(columna: ColumnaDinamica): string {
    const tipo = columna.format?.type;
    return tipo === 'integer' || tipo === 'decimal' || tipo === 'percent' ? 'text-right' : 'text-left';
  }

  /** Si esta celda concreta responde al clic — solo cuando su clave está en `columnasClicables`. */
  protected clicable(columna: ColumnaDinamica): boolean {
    return this.columnasClicables().includes(columna.key);
  }

  protected onClickFila(fila: Record<string, unknown>): void {
    // Con `columnasClicables` el clic lo maneja la celda, no la fila.
    if (this.seleccionable() && !this.columnasClicables().length) {
      this.filaSeleccionada.emit(fila);
    }
  }

  protected onClickCelda(columna: ColumnaDinamica, fila: Record<string, unknown>): void {
    if (this.clicable(columna)) {
      this.celdaSeleccionada.emit({ clave: columna.key, fila });
    }
  }
}

import { Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import type { ColumnaReporte, FilaEncabezadoReporte, FilaReporte } from '../models/tabla-reporte.model';

function numeroColumnas(cols: ColumnaReporte['cols']): number {
  return cols ? Number(cols) : 1;
}

/** Quita las columnas `hidden` de una fila de encabezado y reparte el `colspan`. */
function filaEncabezadoVisible(columnas: ColumnaReporte[]): ColumnaReporte[] {
  const visibles = columnas.filter((columna) => !columna.hidden);
  const declarado = visibles.reduce((total, columna) => total + numeroColumnas(columna.cols), 0);
  if (declarado >= columnas.length) return visibles;

  const resultado: ColumnaReporte[] = [];
  let i = 0;
  while (i < columnas.length) {
    const columna = columnas[i];
    if (!columna.hidden) {
      resultado.push(columna);
      i++;
      continue;
    }

    let j = i;
    while (columnas[j]?.hidden) j++;
    const largoRacha = j - i;
    const anterior = resultado[resultado.length - 1];
    const siguiente = columnas[j];
    const reachAnterior = anterior ? numeroColumnas(anterior.cols) - 1 : 0;
    const reachSiguiente = siguiente ? numeroColumnas(siguiente.cols) - 1 : 0;
    // La siguiente solo puede cubrir esta racha si no arrastra una oculta propia:
    // si la tiene, su `cols` extra es para esa, no para esta.
    const siguienteLibre = !!siguiente && !columnas[j + 1]?.hidden;

    if (reachAnterior < largoRacha && !(siguienteLibre && reachSiguiente >= largoRacha) && anterior) {
      const colSpan = numeroColumnas(anterior.cols) + (largoRacha - reachAnterior);
      resultado[resultado.length - 1] = { ...anterior, cols: colSpan };
    }
    i = j;
  }
  return resultado;
}

/** Tabla genérica para reportes. */
@Component({
  selector: 'app-tabla-reporte',
  standalone: true,
  imports: [TableModule],
  templateUrl: './tabla-reporte.component.html',
})
export class TablaReporteComponent {
  readonly encabezados = input.required<FilaEncabezadoReporte[]>();
  readonly filas = input.required<FilaReporte[]>();
  readonly cargando = input(false);
  /** Si `true`, cada fila del cuerpo se puede clickear. */
  readonly seleccionable = input(false);
  readonly filaSeleccionada = output<FilaReporte>();

  /** Ajustar ancho de columnas al contenido. */
  readonly ajustarAncho = input(false);

  protected claseCelda(): string {
    return this.ajustarAncho() ? 'whitespace-normal break-words text-center' : 'whitespace-nowrap';
  }

  protected claseEncabezado(): string {
    return this.ajustarAncho() ? 'whitespace-normal break-words' : 'whitespace-nowrap';
  }

  /** Extrae las columnas de una fila de encabezado. */
  private columnasDe(fila: FilaEncabezadoReporte | undefined): ColumnaReporte[] {
    return (fila?.columns ?? []).filter((columna): columna is ColumnaReporte => columna != null);
  }

  /** Columnas hoja con datos. */
  protected readonly columnasDato = computed(() => {
    const todas = this.encabezados().flatMap((fila) => this.columnasDe(fila));
    return todas.filter((c) => c.isdata != null).sort((a, b) => (a.isdata ?? 0) - (b.isdata ?? 0));
  });

  /** Filas de encabezado visibles. */
  protected readonly filasEncabezado = computed(() =>
    this.encabezados().map((filaEnc) => filaEncabezadoVisible(this.columnasDe(filaEnc)))
  );

  protected valor(fila: FilaReporte, columna: ColumnaReporte): unknown {
    return fila[columna.columnDef];
  }

  /** Fondo del encabezado. */
  protected fondoEncabezado(columna: ColumnaReporte): string {
    return columna.style?.background ?? 'var(--mis-primary)';
  }

  /** Color del texto del encabezado. */
  protected colorEncabezado(columna: ColumnaReporte): string {
    const styleColor = columna.style ? (columna.style['color'] as string | undefined) : undefined;
    if (styleColor) return styleColor;
    const headerTexto = (columna.header ?? columna.columnDef ?? '').toLowerCase();
    if (headerTexto.includes('real')) {
      return '#4ade80';
    }
    return 'var(--mis-text-on-primary)';
  }

  /** Ancho del encabezado. */
  protected anchoEncabezado(columna: ColumnaReporte): string | null {
    // En modo ajustado no se respeta el ancho fijo del backend: es justamente lo
    // que fuerza el scroll horizontal que este modo viene a evitar.
    if (this.ajustarAncho()) return null;
    return columna.style?.desktop?.width ?? null;
  }

  /** Fondo de celda. */
  protected fondoCelda(fila: FilaReporte, columna: ColumnaReporte): string | null {
    return (fila[`background_${columna.columnDef}`] as string | undefined) ?? null;
  }

  /** Color del texto de celda. */
  protected colorCelda(fila: FilaReporte, columna: ColumnaReporte): string | null {
    return (fila[`color_${columna.columnDef}`] as string | undefined) ?? null;
  }

  /** Clase de texto para celda. */
  protected claseTextoCelda(fila: FilaReporte, columna: ColumnaReporte): string {
    const estilo = fila[`style_${columna.columnDef}`];
    if (estilo === null || estilo === undefined || estilo === '') return '';
    const num = Number(estilo);
    if (num === 1) return 'text-[var(--mis-success)] font-semibold';
    if (num === 0) return 'text-orange-500 font-semibold';
    if (num === -1) return 'text-[var(--mis-danger)] font-semibold';
    return '';
  }

  /** Fondo de la fila completa. */
  protected fondoFila(fila: FilaReporte): string | null {
    return (fila['background'] as string | undefined) ?? null;
  }

  protected onClickFila(fila: FilaReporte): void {
    if (this.seleccionable()) this.filaSeleccionada.emit(fila);
  }

  protected esSemaforo(columna: ColumnaReporte): boolean {
    return columna.format?.['type'] === 'traffic-light';
  }

  /** Determina si se dibuja el semáforo. */
  protected mostrarSemaforo(fila: FilaReporte, columna: ColumnaReporte): boolean {
    if (!this.esSemaforo(columna)) return false;
    const valor = this.valor(fila, columna);
    return valor !== null && valor !== undefined && valor !== '';
  }

  /** Alineación de la celda de datos. */
  protected alineacion(columna: ColumnaReporte): string {
    if (this.esSemaforo(columna)) return 'text-center w-8 px-1';
    const tipo = columna.format?.['type'];
    return tipo === 'number' || tipo === 'percent' ? 'text-right' : 'text-left';
  }

  /** Estilos de la fila completa. */
  protected claseFila(fila: FilaReporte): string {
    return fila['style'] === 1 ? 'font-bold bg-[var(--mis-primary-light)]' : '';
  }

  protected formatear(valor: unknown, columna: ColumnaReporte): string {
    if (valor === null || valor === undefined || valor === '') return '';
    switch (columna.format?.['type']) {
      case 'number':
        return typeof valor === 'number' ? new Intl.NumberFormat('es-PE').format(valor) : String(valor);
      case 'percent':
        return typeof valor === 'number'
          ? new Intl.NumberFormat('es-PE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor)
          : String(valor);
      default:
        return String(valor);
    }
  }

  /** Color del ícono de semáforo. */
  protected colorSemaforo(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return 'text-[var(--mis-text-tertiary)]';
    const num = Number(valor);
    if (num === 1) return 'text-[var(--mis-success)]';
    if (num === 0) return 'text-orange-500';
    if (num === -1) return 'text-[var(--mis-danger)]';
    return 'text-[var(--mis-text-tertiary)]';
  }
}

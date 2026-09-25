import { Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { normalizarHex, textoSobre } from '../../../../theme/color.util';
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

/**
 * Decimales de un `format.mode` del backend, en la notación `digitsInfo` de `DecimalPipe`:
 * `"{enteros}.{mínimo}-{máximo}"` (`".0-0"`, `"1.1-2"`). Sin `mode`, o uno que no se entiende,
 * se usan los decimales por defecto de la columna.
 */
function decimalesDeModo(
  modo: unknown,
  porDefecto: { min: number; max: number },
): { enteros: number; min: number; max: number } {
  const m = typeof modo === 'string' ? /^(\d+)?\.(\d+)-(\d+)$/.exec(modo.trim()) : null;
  if (!m) return { enteros: 1, ...porDefecto };
  const min = Number(m[2]);
  return { enteros: Math.max(1, Number(m[1] ?? 1)), min, max: Math.max(min, Number(m[3])) };
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

  /**
   * Todos los encabezados con el color del tema, ignorando el `style.background`/`color` del backend,
   * como la tabla paginada del legado (`app-table-ajax`, que no aplica el `style` de la columna).
   */
  readonly encabezadoUniforme = input(false);

  /**
   * Las celdas de datos nunca hacen salto de línea, tampoco con `ajustarAncho`: ahí lo que salta de
   * línea son los **encabezados** (ver `claseEncabezado`), así las columnas se angostan sin partir
   * las filas. Un dato en dos renglones (`-1,083,623`, `-18 pbs`, un código) no se lee, y el
   * backend no siempre marca como `number` las columnas numéricas.
   */
  protected claseCelda(): string {
    return 'whitespace-nowrap';
  }

  /** Con `ajustarAncho`, el encabezado salta de línea para que la columna no sea más ancha que su dato; el de la etiqueta de la fila no. */
  protected claseEncabezado(columna: ColumnaReporte): string {
    return this.ajustarAncho() && !this.esEtiqueta(columna) ? 'whitespace-normal break-words' : 'whitespace-nowrap';
  }

  /** Primera columna de datos: la etiqueta de la fila. */
  private esEtiqueta(columna: ColumnaReporte): boolean {
    return columna.columnDef === this.columnasDato()[0]?.columnDef;
  }

  /** Extrae las columnas de una fila de encabezado. */
  private columnasDe(fila: FilaEncabezadoReporte | undefined): ColumnaReporte[] {
    return (fila?.columns ?? []).filter((columna): columna is ColumnaReporte => columna != null);
  }

  /** Columnas hoja con datos. */
  protected readonly columnasDato = computed(() => {
    const todas = this.encabezados().flatMap((fila) => this.columnasDe(fila));
    return todas.filter((c) => c.isdata != null).sort(
      (a, b) => (a.ordenPresentacion ?? a.isdata ?? 0) - (b.ordenPresentacion ?? b.isdata ?? 0),
    );
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
    if (this.encabezadoUniforme()) return 'var(--mis-primary)';
    return columna.style?.background ?? 'var(--mis-primary)';
  }

  /** Color del texto del encabezado. */
  protected colorEncabezado(columna: ColumnaReporte): string {
    if (this.encabezadoUniforme()) return 'var(--mis-text-on-primary)';
    const styleColor = columna.style ? (columna.style['color'] as string | undefined) : undefined;
    if (styleColor) return styleColor;
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

  /**
   * Color del texto de celda: el `color_<columnDef>` del backend o, si la celda trae fondo propio
   * (`background_<columnDef>`, p. ej. el verde de *Destino de Crédito*), el que contrasta con él.
   */
  protected colorCelda(fila: FilaReporte, columna: ColumnaReporte): string | null {
    const propio = fila[`color_${columna.columnDef}`] as string | undefined;
    if (propio) return propio;
    const fondo = this.fondoCelda(fila, columna);
    return fondo && normalizarHex(fondo) ? textoSobre(fondo) : null;
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

  /**
   * Formatea la celda con lo que declara el backend en `format`, como el legado:
   * `mode` son los decimales en notación de `DecimalPipe` (`".0-0"` sin decimales, `"1.1-2"` de 1 a 2)
   * y `unit` una unidad que va detrás del número (`"pbs"` en las variaciones de TAPP).
   */
  protected formatear(valor: unknown, columna: ColumnaReporte): string {
    if (valor === null || valor === undefined || valor === '') return '';
    const formato = columna.format ?? {};
    const tipo = formato['type'];
    if ((tipo !== 'number' && tipo !== 'percent') || typeof valor !== 'number') return String(valor);

    const decimales = decimalesDeModo(formato['mode'], tipo === 'percent' ? { min: 1, max: 1 } : { min: 0, max: 3 });
    const texto = new Intl.NumberFormat('es-PE', {
      ...(tipo === 'percent' ? { style: 'percent' } : {}),
      minimumIntegerDigits: decimales.enteros,
      minimumFractionDigits: decimales.min,
      maximumFractionDigits: decimales.max,
    }).format(valor);
    const unidad = formato['unit'];
    return typeof unidad === 'string' && unidad ? `${texto} ${unidad}` : texto;
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

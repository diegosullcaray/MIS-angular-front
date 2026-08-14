import { Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import type { ColumnaReporte, FilaEncabezadoReporte, FilaReporte } from '../../models/tabla-reporte.model';

function numeroColumnas(cols: ColumnaReporte['cols']): number {
  return cols ? Number(cols) : 1;
}

/**
 * Reparte cada columna `hidden` entre su vecina visible anterior o siguiente
 * según cuál de las dos ya declaró un `cols` lo bastante ancho como para
 * cubrirla — el legado no es consistente en la dirección: a veces la
 * columna ANTERIOR cubre hacia adelante su propio semáforo oculto (ej. "TMM"
 * declara `cols:2` para cubrir el semáforo que la sigue), otras veces es la
 * columna SIGUIENTE la que cubre hacia atrás (ej. "Variación" declara
 * `cols:2` para cubrir el semáforo oculto de "Número de Clientes a Hoy" que
 * va justo antes — `cliente_producto_sec_01`, real). La siguiente solo puede
 * "ceder" su ancho si no lo necesita para cubrir, a su vez, un semáforo
 * propio inmediatamente después de ella. Si ninguna cubre, se ensancha la
 * anterior (nunca se angosta una ya declarada correctamente — `Math.max` de
 * toda la vida).
 */
function filaEncabezadoVisible(columnas: ColumnaReporte[]): ColumnaReporte[] {
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
 * Tabla genérica del motor de reportes "mixtos" — reemplaza a
 * `app-table-multiheader`/`TableMHService` del legado
 * (`reportes/legacy/support/components/table/table-multiheader`). Igual que
 * el legado, es 100% dirigida por los datos que devuelve el backend
 * (`encabezados`/`filas`) — no declara columnas fijas, porque cada reporte
 * (`cod_rep`) puede traer un set de columnas distinto.
 *
 * No migra paginación/orden/edición/fila de totales: `theme_tb1()` (el único
 * tema usado por los reportes migrados hasta ahora, ver `cra-map.ts`) los
 * tenía todos desactivados, y la fila de totales del legado estaba, de
 * hecho, comentada/muerta en el propio HTML (`table-multiheader.component.html`).
 * Tampoco migra los formatos `variation`/`ratio` ni celdas interactivas
 * (`button`/`checkbox`/`radio`, solo aplicables bajo `theme.edit === true`) —
 * agregar soporte cuando algún reporte migrado los necesite de verdad.
 */
@Component({
  selector: 'app-tabla-reporte',
  standalone: true,
  imports: [TableModule],
  templateUrl: './tabla-reporte.component.html',
  styleUrl: './tabla-reporte.component.css',
})
export class TablaReporteComponent {
  readonly encabezados = input.required<FilaEncabezadoReporte[]>();
  readonly filas = input.required<FilaReporte[]>();
  readonly cargando = input(false);
  /** Si `true`, cada fila del cuerpo se puede clickear (cursor + `filaSeleccionada`) — ej. "Encuesta Clientes", elegir un cliente de la lista. `false` por defecto: no afecta a los reportes de solo lectura que no lo usan. */
  readonly seleccionable = input(false);
  readonly filaSeleccionada = output<FilaReporte>();

  /** Columnas "hoja" (con datos) de todas las filas de encabezado, en el orden que indica `isdata` — `setdisplayedData()` del legado. */
  protected readonly columnasDato = computed(() => {
    const todas = this.encabezados().flatMap((fila) => fila.columns);
    return todas.filter((c) => c.isdata != null).sort((a, b) => (a.isdata ?? 0) - (b.isdata ?? 0));
  });

  /**
   * Filas de encabezado listas para renderizar, excluyendo las columnas `hidden`
   * — no ocupan `<th>` ni reservan espacio en la grilla (su dato sigue en el
   * cuerpo vía `columnasDato`), igual que la clase `hidden` del legado
   * (`table-multiheader.component.html`), que solo saca el `<th>` del flujo de
   * la tabla vía CSS sin tocar el `<td>`. Ver `filaEncabezadoVisible()` para
   * cómo se decide a cuál columna visible se le suma el colspan de cada
   * columna oculta.
   */
  protected readonly filasEncabezado = computed(() =>
    this.encabezados().map((filaEnc) => filaEncabezadoVisible(filaEnc.columns))
  );

  protected valor(fila: FilaReporte, columna: ColumnaReporte): unknown {
    return fila[columna.columnDef];
  }

  protected onClickFila(fila: FilaReporte): void {
    if (this.seleccionable()) this.filaSeleccionada.emit(fila);
  }

  protected esSemaforo(columna: ColumnaReporte): boolean {
    return columna.format?.['type'] === 'traffic-light';
  }

  /**
   * Si hay que dibujar el ícono de semáforo para esta celda — no alcanza con
   * `esSemaforo()` (columna) sola: algunos reportes declaran la columna de
   * semáforo pero el backend nunca manda valor para ninguna fila (ej. "TAM"
   * en `DESEMP_SOC_01`). En ese caso no tiene sentido pintar un punto gris
   * "sin significado" — mejor dejar la celda vacía.
   */
  protected mostrarSemaforo(fila: FilaReporte, columna: ColumnaReporte): boolean {
    if (!this.esSemaforo(columna)) return false;
    const valor = this.valor(fila, columna);
    return valor !== null && valor !== undefined && valor !== '';
  }

  /** Alineación de la celda de datos: números/porcentajes a la derecha, todo lo demás (texto, fechas) a la izquierda; semáforos centrados. */
  protected alineacion(columna: ColumnaReporte): string {
    if (this.esSemaforo(columna)) return 'text-center';
    const tipo = columna.format?.['type'];
    return tipo === 'number' || tipo === 'percent' ? 'text-right' : 'text-left';
  }

  /**
   * Énfasis de fila según `fila['style']` — misma convención del legado
   * (`row.style`, `table-multiheader.component.html`: `level-1..5`), pero sin
   * las reglas CSS originales (el `.scss` del legado estaba vacío en el
   * volcado). Se implementan los valores confirmados con datos reales
   * (`DESEMP_SOC_01`): `1` = fila de categoría/subtotal (negrita + fondo
   * bien visible, ej. "Clientes Nuevos del Mes"). Cualquier otro valor,
   * incluido el caso normal `0`, sin énfasis — ajustar si aparecen otros
   * valores. `--mis-primary-light` en vez de `--mis-hover-bg` (4% de opacidad,
   * casi imperceptible) — necesita distinguirse a simple vista, no solo al pasar el mouse.
   */
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

  /**
   * Color del ícono de semáforo — misma convención confirmada en el propio
   * código del legado (`table-multiheader.component.html`:
   * `'green-icon':c.cell(row)==1, 'orange-icon':c.cell(row)==0,
   * 'red-icon':c.cell(row)==-1`, con `==` — el legado comparaba suelto a
   * propósito): `1` = éxito, `0` = alerta, `-1` = peligro, cualquier otro
   * valor = neutro. El backend manda el valor como string (`"1"`/`"0"`/`"-1"`),
   * por eso se normaliza con `Number()` antes de comparar.
   *
   * El naranja de alerta usa `orange-500` de Tailwind en vez de
   * `--mis-warning` (`#B45309`, un ámbar oscuro pensado para texto/badges):
   * en un ícono tan chico (10px) se confundía con el rojo de peligro.
   */
  protected colorSemaforo(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return 'text-[var(--mis-text-tertiary)]';
    const num = Number(valor);
    if (num === 1) return 'text-[var(--mis-success)]';
    if (num === 0) return 'text-orange-500';
    if (num === -1) return 'text-[var(--mis-danger)]';
    return 'text-[var(--mis-text-tertiary)]';
  }
}

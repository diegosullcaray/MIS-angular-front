import { Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import type { ColumnaReporte, FilaEncabezadoReporte, FilaReporte } from '../models/tabla-reporte.model';

function numeroColumnas(cols: ColumnaReporte['cols']): number {
  return cols ? Number(cols) : 1;
}

/**
 * Quita las columnas `hidden` de una fila de encabezado y reparte, si hace falta, el `colspan`
 * que las cubra.
 *
 * El backend manda la columna del semáforo oculta, pegada al dato que anota, y espera que ese
 * dato la cubra con `cols: 2` (punto + número). Pero unas veces la oculta va **antes** del dato
 * (`[8] TMMSALDO(2)` en `CARACT_pas_01`) y otras **después** (`meta(1) [meta_sem]` en
 * `DESEMP_SOC_01`), y las dos formas son localmente indistinguibles.
 *
 * Lo que sí las distingue es si la fila ya cierra: el ancho de la grilla es el total de columnas
 * (visibles + ocultas), así que cuando lo declarado por las visibles ya llega a ese total, cada
 * oculta tiene dueño y no hay nada que ensanchar. Ensanchar igual —como se hacía antes— metía un
 * `colspan` de más: en `CARACT_pas_01` la columna "Meta" absorbía el punto del par siguiente y
 * todas las columnas a partir de ahí quedaban corridas.
 *
 * Solo cuando falta ancho se reparte, y ahí sí vale la heurística de vecindad.
 */
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

/** Tabla genérica del motor de reportes "mixtos", dirigida 100% por los datos del backend porque cada `cod_rep` trae columnas distintas. */
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
  /** Si `true`, cada fila del cuerpo se puede clickear (cursor + `filaSeleccionada`) — ej. "Encuesta Clientes", elegir un cliente de la lista. */
  readonly seleccionable = input(false);
  readonly filaSeleccionada = output<FilaReporte>();

  /**
   * Deja que el texto de cabeceras y celdas haga salto de línea, para que la
   * tabla entre en el ancho de la pantalla en vez de generar scroll horizontal.
   *
   * Por defecto va en `nowrap`, que es lo que corresponde a los reportes anchos:
   * ahí el scroll es preferible a apretar veinte columnas. Lo activan los
   * reportes de pocas columnas y encabezados largos —"Proyección Diaria
   * Colocación"— donde el `nowrap` sacaba scroll sin necesidad.
   */
  readonly ajustarAncho = input(false);

  protected claseCelda(): string {
    return this.ajustarAncho() ? 'whitespace-normal break-words text-center' : 'whitespace-nowrap';
  }

  protected claseEncabezado(): string {
    return this.ajustarAncho() ? 'whitespace-normal break-words' : 'whitespace-nowrap';
  }

  /** Columnas de una fila de encabezado, tolerando `columns` ausente o con huecos: estos `computed` corren dentro de la detección de cambios y una excepción congelaría toda la app, no solo la tabla. */
  private columnasDe(fila: FilaEncabezadoReporte | undefined): ColumnaReporte[] {
    return (fila?.columns ?? []).filter((columna): columna is ColumnaReporte => columna != null);
  }

  /** Columnas "hoja" (con datos) de todas las filas de encabezado, en el orden que indica `isdata` — `setdisplayedData()` del legado. */
  protected readonly columnasDato = computed(() => {
    const todas = this.encabezados().flatMap((fila) => this.columnasDe(fila));
    return todas.filter((c) => c.isdata != null).sort((a, b) => (a.isdata ?? 0) - (b.isdata ?? 0));
  });

  /** Filas de encabezado sin las columnas `hidden`: no ocupan `<th>` pero su dato sigue en el cuerpo vía `columnasDato`. */
  protected readonly filasEncabezado = computed(() =>
    this.encabezados().map((filaEnc) => filaEncabezadoVisible(this.columnasDe(filaEnc)))
  );

  protected valor(fila: FilaReporte, columna: ColumnaReporte): unknown {
    return fila[columna.columnDef];
  }

  /** Fondo del `<th>`: `style` es un objeto estructurado, no CSS inline — volcarlo entero tapaba los números de las columnas de datos. */
  protected fondoEncabezado(columna: ColumnaReporte): string {
    return columna.style?.background ?? 'var(--mis-primary)';
  }

  /** Ancho fijo del encabezado si el backend lo indica — `c.style?.desktop?.width` del legado. */
  protected anchoEncabezado(columna: ColumnaReporte): string | null {
    // En modo ajustado no se respeta el ancho fijo del backend: es justamente lo
    // que fuerza el scroll horizontal que este modo viene a evitar.
    if (this.ajustarAncho()) return null;
    return columna.style?.desktop?.width ?? null;
  }

  /** Fondo de una celda del cuerpo: viene por FILA, no por columna — `row['background_' + c.columnDef]` del legado. */
  protected fondoCelda(fila: FilaReporte, columna: ColumnaReporte): string | null {
    return (fila[`background_${columna.columnDef}`] as string | undefined) ?? null;
  }

  /** Color del texto de una celda suelta — `row['color_' + c.columnDef]` del legado. */
  protected colorCelda(fila: FilaReporte, columna: ColumnaReporte): string | null {
    return (fila[`color_${columna.columnDef}`] as string | undefined) ?? null;
  }

  /** Énfasis del texto de una celda suelta — `row['style_' + c.columnDef]` del legado (`green-text`/`red-text`/`orange-text`), misma convención de signo que el semáforo: `1` bien, `0` alerta, `-1` mal. */
  protected claseTextoCelda(fila: FilaReporte, columna: ColumnaReporte): string {
    const estilo = fila[`style_${columna.columnDef}`];
    if (estilo === null || estilo === undefined || estilo === '') return '';
    const num = Number(estilo);
    if (num === 1) return 'text-[var(--mis-success)] font-semibold';
    if (num === 0) return 'text-orange-500 font-semibold';
    if (num === -1) return 'text-[var(--mis-danger)] font-semibold';
    return '';
  }

  /** Fondo de la fila completa — `row.background` del legado. */
  protected fondoFila(fila: FilaReporte): string | null {
    return (fila['background'] as string | undefined) ?? null;
  }

  protected onClickFila(fila: FilaReporte): void {
    if (this.seleccionable()) this.filaSeleccionada.emit(fila);
  }

  protected esSemaforo(columna: ColumnaReporte): boolean {
    return columna.format?.['type'] === 'traffic-light';
  }

  /** Si hay que dibujar el ícono de semáforo para esta celda — no alcanza con `esSemaforo()` (columna) sola: algunos reportes declaran la columna de semáforo pero el backend nunca manda valor para ninguna fila (ej. "TAM" en `DESEMP_SOC_01`). */
  protected mostrarSemaforo(fila: FilaReporte, columna: ColumnaReporte): boolean {
    if (!this.esSemaforo(columna)) return false;
    const valor = this.valor(fila, columna);
    return valor !== null && valor !== undefined && valor !== '';
  }

  /** Alineación de la celda de datos: números/porcentajes a la derecha, todo lo demás (texto, fechas) a la izquierda; semáforos centrados y estrechos (`width_gt_xs_tl` del legado) — sin acotar el ancho, el punto queda perdido en una columna tan ancha como las de datos. */
  protected alineacion(columna: ColumnaReporte): string {
    if (this.esSemaforo(columna)) return 'text-center w-8 px-1';
    const tipo = columna.format?.['type'];
    return tipo === 'number' || tipo === 'percent' ? 'text-right' : 'text-left';
  }

  /** Énfasis de fila según `fila['style']` — misma convención del legado (`row.style`, `table-multiheader.component.html`: `level-1..5`), pero sin las reglas CSS originales (el `.scss` del legado estaba vacío en el volcado). */
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

  /** Color del ícono de semáforo — misma convención confirmada en el propio código del legado (`table-multiheader.component.html`: `'green-icon':c.cell(row)==1, 'orange-icon':c.cell(row)==0, 'red-icon':c.cell(row)==-1`, con `==` — el legado comparaba suelto a propósito): `1` = éxito, `0` = alerta, `-1` = peligro, cualquier otro valor = neutro. */
  protected colorSemaforo(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return 'text-[var(--mis-text-tertiary)]';
    const num = Number(valor);
    if (num === 1) return 'text-[var(--mis-success)]';
    if (num === 0) return 'text-orange-500';
    if (num === -1) return 'text-[var(--mis-danger)]';
    return 'text-[var(--mis-text-tertiary)]';
  }
}

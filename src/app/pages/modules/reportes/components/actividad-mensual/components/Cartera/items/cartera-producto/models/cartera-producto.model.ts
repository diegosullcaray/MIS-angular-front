import type { BloqueGrafico } from '../../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { FilaReporte, TablaReporteResultado } from '../../../../../../../models/tabla-reporte.model';

/** Tarjeta KPI estándar del Design System (docs/02-arquitectura/05-guia-estilos-kpis-reportes.md). */
export interface TarjetaKpiCarteraProducto {
  etiqueta: string;
  valor: number | string;
  comparativo: string;
}

export interface CarteraProductoResultado {
  tabla: TablaReporteResultado;
  graficos: BloqueGrafico[];
  tarjetas: TarjetaKpiCarteraProducto[];
}

export const CARTERA_PRODUCTO_VACIO: CarteraProductoResultado = {
  tabla: { headers: [], body: [], additional: {} },
  graficos: [],
  tarjetas: [],
};

/**
 * Extrae las tarjetas KPI por producto a partir de los bloques de gráficos Highcharts
 * (donde cada gráfico representa un producto con sus cifras temporales) o de la tabla.
 */
export function extraerTarjetasCarteraProducto(
  tabla: TablaReporteResultado,
  graficos: BloqueGrafico[] = []
): TarjetaKpiCarteraProducto[] {
  // 1. Extraer desde cada bloque gráfico devuelto por el backend (un bloque por producto)
  if (graficos && graficos.length > 0) {
    const tarjetasDesdeGraficos = graficos
      .map((g) => {
        // Obtener todos los valores numéricos de las series
        const todasSeries = g.series ?? [];
        let ultimoValor: number | null = null;

        for (const s of todasSeries) {
          const valoresValidos = (s.datos ?? []).filter(
            (d): d is number => d !== null && d !== undefined && typeof d === 'number' && !isNaN(d)
          );
          if (valoresValidos.length > 0) {
            ultimoValor = valoresValidos[valoresValidos.length - 1];
            break;
          }
        }

        return {
          etiqueta: (g.titulo || 'Producto').trim(),
          valor: ultimoValor !== null ? ultimoValor : 0,
          comparativo: g.tituloEjeY || 'En miles',
        };
      })
      .filter((t) => t.etiqueta.length > 0);

    if (tarjetasDesdeGraficos.length > 0) {
      return tarjetasDesdeGraficos;
    }
  }

  // 2. Fallback desde la tabla
  const filas: FilaReporte[] = tabla.body ?? [];
  if (filas.length === 0) return [];

  const todasCols = (tabla.headers ?? []).flatMap((h) => h.columns ?? []).filter((c) => c != null && !c.hidden);
  const colNombre = todasCols.find((c) => /prod|nom|desc|rubro/i.test(c.columnDef || '') || /prod|nom|desc|rubro/i.test(c.header || '')) ?? todasCols[0];
  const colsNumericas = todasCols.filter((c) => c !== colNombre);
  const colValor = colsNumericas.length > 0 ? colsNumericas[colsNumericas.length - 1] : undefined;

  const filasProductos = filas.filter(
    (f: FilaReporte) =>
      f['style'] !== 1 &&
      !Object.values(f).some((v) => typeof v === 'string' && v.trim().toUpperCase() === 'TOTAL')
  );

  return filasProductos.map((f: FilaReporte) => {
    const nombre = colNombre ? String(f[colNombre.columnDef] ?? '') : String(Object.values(f)[0] ?? '');
    const saldoRaw = colValor ? f[colValor.columnDef] : Object.values(f)[1];
    const numClean = typeof saldoRaw === 'number' ? saldoRaw : parseFloat(String(saldoRaw ?? '').replace(/[^0-9.-]/g, ''));
    return {
      etiqueta: nombre.trim() || 'Producto',
      valor: isNaN(numClean) ? 0 : numClean,
      comparativo: 'En miles',
    };
  });
}

import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado combinado de "Clientes Producto" (`ClientesProductoService.obtenerClientesProducto`) — 3 bloques del legado (`rda/sectorista/cliente_producto/cliente_producto_sec_01/_02/_03`). */
export interface ReporteClientesProducto {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
}

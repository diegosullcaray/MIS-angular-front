import type { BloqueGrafico } from '../../../../../models/grafico-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { DataTableColumn } from '../../../../../../../../shared/ui/data-table/data-table.model';

export interface TotalAgro {
  etiqueta: string;
  /** `entero` para conteos y hectáreas, `moneda` para saldos. */
  formato: 'entero' | 'moneda';
  actual: number;
  anterior: number;
  /** `1` sube, `-1` baja, `0` igual. */
  senal: number;
}

export interface CarteraAgricolaResultado {
  tabla: TablaDinamicaResultado;
  totales: TotalAgro[];
}

export const CARTERA_AGRICOLA_VACIA: CarteraAgricolaResultado = { tabla: { columnas: [], filas: [] }, totales: [] };

/**
 * Resultado combinado del `forkJoin` de RS_AGROMIX_02 al 05.
 *
 * `filasPorGrafico` es el `detailDataMap` del legado: solo los dos gráficos que
 * abren detalle guardan sus filas, porque son los únicos con clic.
 */
export interface DetalleAgricolaResultado {
  graficos: BloqueGrafico[];
  filasPorGrafico: Record<string, Record<string, unknown>[]>;
}

/**
 * Los cuatro gráficos del detalle, en el orden en que los pinta el legado.
 *
 * `id` marca los dos que abren el modal de detalle al hacer clic en una barra
 * (`showDetailsPopup(..., 'saldoVencido'|'saldoCartera')`); los otros dos no
 * tienen clic en el legado.
 */
export const GRAFICOS_AGRICOLA: { codRep: string; titulo: string; id?: string }[] = [
  { codRep: 'RS_AGROMIX_03', titulo: 'Distribución Saldo por Cultivo', id: 'saldoCartera' },
  { codRep: 'RS_AGROMIX_02', titulo: 'Distribución Saldo Vencido por Cultivo', id: 'saldoVencido' },
  { codRep: 'RS_AGROMIX_04', titulo: 'Distribución de Clientes por Cultivo' },
  { codRep: 'RS_AGROMIX_05', titulo: 'Resumen General' },
];

/** Las cuatro cifras del encabezado, con la clave que comparten la fila total y `meta1` — legado `agro-mix-d.component.ts`. */
export const TOTALES_AGRO: { clave: string; etiqueta: string; formato: 'entero' | 'moneda' }[] = [
  { clave: 'HSALCAPMN', etiqueta: 'Saldo Capital (miles PEN)', formato: 'moneda' },
  { clave: 'HSALVEMN', etiqueta: 'Saldo Vencido (miles PEN)', formato: 'moneda' },
  { clave: 'HCCLI', etiqueta: 'Nro Clientes', formato: 'entero' },
  { clave: 'EXTE', etiqueta: 'Extensión', formato: 'entero' },
];

/**
 * Columnas del modal de detalle por cultivo — legado `tableHeadersModal`
 * (`agro-mix-d.util.ts`), más la columna de acción que abre el mapa.
 *
 * Van como `DataTableColumn` (no `ColumnaDinamica`) porque el modal usa
 * `app-data-table`, que es la tabla del sistema con buscador, orden,
 * paginado y filtros por columna — el legado traía su propio input de
 * búsqueda y su paginador de 10 sueltos.
 */
export const COLUMNAS_DETALLE_CULTIVO: DataTableColumn[] = [
  { field: 'HDESCUL', header: 'Producto', filterType: 'text' },
  { field: 'HDESCLI', header: 'Cliente', width: '14rem', filterType: 'text' },
  { field: 'HETPROD', header: 'Estado Producto', filterType: 'text' },
  { field: 'HCTACLI', header: 'Cuenta Cliente', filterType: 'text' },
  { field: 'HCAPMON', header: 'Saldo Capital', align: 'right', filterType: 'number' },
  { field: 'HVENMON', header: 'Saldo Vencido', align: 'right', filterType: 'number' },
  { field: 'HEXTENS', header: 'Extensión', align: 'right', filterType: 'number', mobileVisible: false },
  { field: 'ubicacion', header: 'Ubicación', align: 'center', width: '7rem', sortable: false },
];

/** Campos por los que busca el modal — los mismos cinco del `filter()` del legado. */
export const BUSQUEDA_DETALLE_CULTIVO = ['HDESCUL', 'HDESCLI', 'HETPROD', 'HCTACLI', 'HFECPRO'];

/** Los cuatro totales que el legado calcula sobre las filas del cultivo elegido. */
export interface TotalesCultivo {
  saldoCartera: number;
  saldoVencido: number;
  extension: number;
  porcentajeVencido: number;
}

export interface DetalleCultivo {
  cultivo: string;
  filas: Record<string, unknown>[];
  totales: TotalesCultivo;
}

/** Ubicación de un cliente en el mapa del detalle — `HLATITU`/`HLONGIT` del legado (`ddMaps()`). */
export interface UbicacionCliente {
  lat: number;
  lng: number;
  etiqueta: string;
}

/** Suma las columnas del cultivo elegido — legado `showDetailsPopup()`. */
export function totalesDeCultivo(filas: Record<string, unknown>[]): TotalesCultivo {
  const suma = (clave: string) => filas.reduce((acc, f) => acc + (Number(f[clave]) || 0), 0);
  const saldoCartera = suma('HCAPMON');
  const saldoVencido = suma('HVENMON');
  return {
    saldoCartera,
    saldoVencido,
    extension: suma('HEXTENS'),
    // Sin saldo de cartera no hay porcentaje que calcular (el legado devolvía NaN/Infinity).
    porcentajeVencido: saldoCartera ? (saldoVencido / saldoCartera) * 100 : 0,
  };
}

/** El legado agrupa por `HDESCUL_Agrupado` y cae a `HDESCUL` cuando no viene. */
export function filasDeCultivo(filas: Record<string, unknown>[], cultivo: string): Record<string, unknown>[] {
  return filas.filter((f) => (f['HDESCUL_Agrupado'] || f['HDESCUL']) === cultivo);
}

import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { DataTableColumn } from '../../../../../../../../shared/ui/data-table/data-table.model';

export interface TotalAgro {
  etiqueta: string;
  /** Formato del total. */
  formato: 'entero' | 'moneda';
  actual: number;
  anterior: number;
  /** Señal de variación. */
  senal: number;
}

export interface CarteraAgricolaResultado {
  tabla: TablaDinamicaResultado;
  totales: TotalAgro[];
}

export const CARTERA_AGRICOLA_VACIA: CarteraAgricolaResultado = { tabla: { columnas: [], filas: [] }, totales: [] };

/** Resultado de Detalle Agrícola. */
export interface DetalleAgricolaResultado {
  graficos: BloqueGrafico[];
  filasPorGrafico: Record<string, Record<string, unknown>[]>;
}

/** Gráficos Agrícolas. */
export const GRAFICOS_AGRICOLA: { codRep: string; titulo: string; id?: string }[] = [
  { codRep: 'RS_AGROMIX_03', titulo: 'Distribución Saldo por Cultivo', id: 'saldoCartera' },
  { codRep: 'RS_AGROMIX_02', titulo: 'Distribución Saldo Vencido por Cultivo', id: 'saldoVencido' },
  { codRep: 'RS_AGROMIX_04', titulo: 'Distribución de Clientes por Cultivo' },
  { codRep: 'RS_AGROMIX_05', titulo: 'Resumen General' },
];

/** Totales Agro. */
export const TOTALES_AGRO: { clave: string; etiqueta: string; formato: 'entero' | 'moneda' }[] = [
  { clave: 'HSALCAPMN', etiqueta: 'Saldo Capital (miles PEN)', formato: 'moneda' },
  { clave: 'HSALVEMN', etiqueta: 'Saldo Vencido (miles PEN)', formato: 'moneda' },
  { clave: 'HCCLI', etiqueta: 'Nro Clientes', formato: 'entero' },
  { clave: 'EXTE', etiqueta: 'Extensión', formato: 'entero' },
];

/** Columnas del detalle de cultivo. */
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

/** Campos de búsqueda del detalle. */
export const BUSQUEDA_DETALLE_CULTIVO = ['HDESCUL', 'HDESCLI', 'HETPROD', 'HCTACLI', 'HFECPRO'];

/** Totales de cultivo. */
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

/** Ubicación de cliente en el mapa. */
export interface UbicacionCliente {
  lat: number;
  lng: number;
  etiqueta: string;
}

/** Calcula totales por cultivo. */
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

/** Filtra filas por cultivo. */
export function filasDeCultivo(filas: Record<string, unknown>[], cultivo: string): Record<string, unknown>[] {
  return filas.filter((f) => (f['HDESCUL_Agrupado'] || f['HDESCUL']) === cultivo);
}

import type { BloqueGrafico } from '../../../../../models/grafico-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';

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

/** Resultado combinado del `forkJoin` de RS_AGROMIX_02 al 05. */
export interface DetalleAgricolaResultado {
  graficos: BloqueGrafico[];
  dataCruda: {
    saldoCapital: Record<string, unknown>[];
    saldoVencido: Record<string, unknown>[];
  };
}

/** Las cuatro cifras del encabezado, con la clave que comparten la fila total y `meta1` — legado `agro-mix-d.component.ts`. */
export const TOTALES_AGRO: { clave: string; etiqueta: string; formato: 'entero' | 'moneda' }[] = [
  { clave: 'HSALCAPMN', etiqueta: 'Saldo Capital (miles PEN)', formato: 'moneda' },
  { clave: 'HSALVEMN', etiqueta: 'Saldo Vencido (miles PEN)', formato: 'moneda' },
  { clave: 'HCCLI', etiqueta: 'Nro Clientes', formato: 'entero' },
  { clave: 'EXTE', etiqueta: 'Extensión', formato: 'entero' },
];

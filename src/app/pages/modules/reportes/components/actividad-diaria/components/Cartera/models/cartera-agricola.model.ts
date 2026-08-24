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

/** Las cuatro cifras del encabezado, con la clave que comparten la fila total y `meta1` — legado `agro-mix-d.component.ts`. */
export const TOTALES_AGRO: { clave: string; etiqueta: string; formato: 'entero' | 'moneda' }[] = [
  { clave: 'HSALCAPMN', etiqueta: 'Saldo capital', formato: 'moneda' },
  { clave: 'HSALVEMN', etiqueta: 'Saldo vencido', formato: 'moneda' },
  { clave: 'HCCLI', etiqueta: 'N° clientes', formato: 'entero' },
  { clave: 'EXTE', etiqueta: 'Extensión (ha)', formato: 'entero' },
];

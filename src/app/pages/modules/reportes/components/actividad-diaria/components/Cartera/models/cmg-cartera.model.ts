import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';

/** Una tarjeta del encabezado de "CMG Cartera". */
export interface TarjetaCmgCartera {
  etiqueta: string;
  valor: number | string;
  /** Texto del contraste (meta, mes anterior, tasa mínima…). */
  comparativo: string;
  /** `1` sube, `-1` baja, `0` sin señal. */
  senal: number;
  /** Texto junto a la flecha cuando hay señal (ej. "-525 pbs", "369"). */
  delta?: string;
  /** % de cumplimiento cuando el backend lo trae (dibuja el aro en vez de la flecha). */
  cumplimiento?: number;
}

export interface CmgCarteraResultado {
  tabla: TablaDinamicaResultado;
  tarjetas: TarjetaCmgCartera[];
}

export const CMG_CARTERA_VACIO: CmgCarteraResultado = { tabla: { columnas: [], filas: [] }, tarjetas: [] };

/** `filter1` del legado (`cmg-cartera.util.ts`) — variable `prod` de las dos consultas. */
export const OPCIONES_FASE_CMG_CARTERA = [
  { id: 1, desc: 'Total' },
  { id: 2, desc: 'Programas del Gobierno' },
  { id: 3, desc: 'Sin Programas de Gobierno' },
];
export const FASE_CMG_CARTERA_POR_DEFECTO = 1;

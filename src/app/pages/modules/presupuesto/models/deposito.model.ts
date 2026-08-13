import type { ColumnaTabla } from './tabla.model';
import type { FilaLineaSimple } from './linea-simple.model';

/**
 * Fila de Depósitos (BP y Red comparten exactamente esta forma — 3 productos:
 * Ahorros (`a*`), CTS (`b*`), Plazo Fijo (`c*`), cada uno con Saldo Inicial /
 * Variación (editable) / Saldo Final).
 */
export interface FilaDeposito extends FilaLineaSimple {
  a1: number;
  a2: number;
  a3: number;
  b1: number;
  b2: number;
  b3: number;
  c1: number;
  c2: number;
  c3: number;
}

/** Columnas de Depósitos — idénticas en BP y Red (antes copiadas en cada componente). */
export const COLUMNAS_DEPOSITO: ColumnaTabla[] = [
  { label: 'Fecha', key: 'fec_pro', tipo: 'text' },
  {
    label: 'Ahorros',
    hijos: [
      { label: 'Saldo Inicial', key: 'a1', tipo: 'number' },
      { label: 'Variación', key: 'a2', tipo: 'comp_f' },
      { label: 'Saldo Final', key: 'a3', tipo: 'number' },
    ],
  },
  {
    label: 'CTS',
    hijos: [
      { label: 'Saldo Inicial', key: 'b1', tipo: 'number' },
      { label: 'Variación', key: 'b2', tipo: 'comp_f' },
      { label: 'Saldo Final', key: 'b3', tipo: 'number' },
    ],
  },
  {
    label: 'Plazo Fijo',
    hijos: [
      { label: 'Saldo Inicial', key: 'c1', tipo: 'number' },
      { label: 'Variación', key: 'c2', tipo: 'comp_f' },
      { label: 'Saldo Final', key: 'c3', tipo: 'number' },
    ],
  },
];

import type { FilaLineaSimple } from './linea-simple.model';

/** Fila de Seguros Comercial — 6 columnas independientes, todas potencialmente editables (`inputCols: 'all'`). */
export interface FilaSegurosComercial extends FilaLineaSimple {
  a1: number; // Multiriesgo
  a2: number; // Multicrédito
  a3: number; // Protección Cuotas
  a4: number; // Agrícola
  a5: number; // OncoCréditos
  a6: number; // Protección Total
}

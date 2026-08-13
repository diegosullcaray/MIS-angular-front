import type { FilaLineaSimple } from './linea-simple.model';

/** Fila de Seguros Operaciones — claves de negocio propias (no siguen el patrón a1/a2/...). */
export interface FilaSegurosOperaciones extends FilaLineaSimple {
  seg_ope_mul_ah: number; // Multiahorro
  seg_ope_pro_tar: number; // Protección Tarjetas
  seg_ope_soat: number; // SOAT
  seg_ope_pro_total: number; // Protección Total
  seg_ope_onco_ahorros: number; // OncoAhorros
}

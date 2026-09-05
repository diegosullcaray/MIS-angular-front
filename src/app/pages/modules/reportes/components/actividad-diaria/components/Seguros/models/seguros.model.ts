/**
 * KPIs de "Reporte Seguros Optativos" — legado `seguro-com.component.ts`
 * (`kpiTotales`), que los saca de la PRIMERA FILA de la tabla (`data[0]`), no
 * de un bloque aparte.
 */
export interface KpisSegurosOptativos {
  totalOperaciones: number;
  totalSeguros: number;
  /** El legado lo pinta con `| percent`, así que llega como fracción. */
  penetracionGlobal: number;
  /** "Rendimiento por Tipo de Seguro Optativo": una mini-tarjeta por producto. */
  porTipo: { etiqueta: string; valor: number }[];
}

export const KPIS_SEGUROS_OPTATIVOS_VACIOS: KpisSegurosOptativos = {
  totalOperaciones: 0,
  totalSeguros: 0,
  penetracionGlobal: 0,
  porTipo: [],
};

/** Clave de la fila total ↔ etiqueta de la mini-tarjeta, en el orden del legado. */
const TIPOS_SEGURO: readonly { clave: string; etiqueta: string }[] = [
  { clave: 'SegMR', etiqueta: 'Multiriesgo' },
  { clave: 'SegMC', etiqueta: 'Vida Segura' },
  { clave: 'SegAgro', etiqueta: 'Agropecuario' },
  { clave: 'SegPC', etiqueta: 'Prot. Cuota' },
  { clave: 'SegOnco', etiqueta: 'Oncológico' },
  { clave: 'SPCCOS', etiqueta: 'Prot. Total' },
];

/**
 * La penetración como FRACCIÓN, que es como la pinta el legado (`| percent`).
 *
 * El comentario del legado duda de la unidad ("asumo que viene como '76.95%' o
 * número") y su `| percent` solo funciona si llega en fracción. Acá se acepta
 * cualquiera de las dos: si el valor trae el signo de porcentaje, el número está
 * en puntos porcentuales y se divide entre 100.
 */
function penetracion(valor: unknown): number {
  if (typeof valor === 'string' && valor.includes('%')) {
    const puntos = Number(valor.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(puntos) ? puntos / 100 : 0;
  }
  const fraccion = Number(valor);
  return Number.isFinite(fraccion) ? fraccion : 0;
}

/** Arma los KPIs desde la primera fila de la tabla — legado `setKpiValues()`. */
export function kpisDeFilaTotal(filas: Record<string, unknown>[]): KpisSegurosOptativos {
  const fila = filas[0];
  if (!fila) return KPIS_SEGUROS_OPTATIVOS_VACIOS;

  const num = (clave: string): number => {
    const valor = Number(fila[clave]);
    return Number.isFinite(valor) ? valor : 0;
  };

  return {
    totalOperaciones: num('TOpeOS'),
    totalSeguros: num('TSegOS'),
    penetracionGlobal: penetracion(fila['PorcPenOS']),
    porTipo: TIPOS_SEGURO.map((t) => ({ etiqueta: t.etiqueta, valor: num(t.clave) })),
  };
}

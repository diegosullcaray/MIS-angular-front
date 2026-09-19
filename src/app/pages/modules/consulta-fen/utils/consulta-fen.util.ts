import type { FilaRiesgoFen, NivelRiesgoFen } from '../models/consulta-fen.model';

const NIVELES = new Set<NivelRiesgoFen>(['Muy Alto', 'Alto', 'Medio', 'Bajo', 'Muy Bajo']);

export function esFilaRiesgoFen(valor: unknown): valor is FilaRiesgoFen {
  if (!valor || typeof valor !== 'object') return false;
  const fila = valor as Record<string, unknown>;
  return ['cod_ubi', 'des_dep', 'des_prov', 'des_dist'].every((campo) => typeof fila[campo] === 'string')
    && /^\d{6}$/.test(fila['cod_ubi'] as string)
    && ['exp_mas', 'exp_inu', 'exp_seq', 'exp_pre'].every((campo) => NIVELES.has(fila[campo] as NivelRiesgoFen));
}

export function mapearFilasFen(valor: unknown): FilaRiesgoFen[] | null {
  return Array.isArray(valor) && valor.every(esFilaRiesgoFen) ? valor : null;
}

export function esRiesgoAlto(nivel: NivelRiesgoFen): boolean {
  return nivel === 'Alto' || nivel === 'Muy Alto';
}

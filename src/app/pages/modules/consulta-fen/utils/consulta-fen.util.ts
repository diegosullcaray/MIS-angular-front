import type { FilaRiesgoFen, NivelRiesgoFen, PuntoMapaFen } from '../models/consulta-fen.model';

const NIVELES = new Set<NivelRiesgoFen>(['Muy Alto', 'Alto', 'Medio', 'Bajo', 'Muy Bajo']);

/** Centros departamentales referenciales; el contrato legado no entrega coordenadas distritales. */
const CENTROS_DEPARTAMENTO: Record<string, readonly [number, number]> = {
  '01': [-6.2317, -77.8690], '02': [-9.5278, -77.5278], '03': [-13.6339, -72.8814],
  '04': [-16.3989, -71.5350], '05': [-13.1588, -74.2232], '06': [-7.1617, -78.5128],
  '07': [-12.0566, -77.1181], '08': [-13.5319, -71.9675], '09': [-12.7862, -74.9764],
  '10': [-9.9306, -76.2422], '11': [-14.0678, -75.7286], '12': [-12.0651, -75.2049],
  '13': [-8.1116, -79.0288], '14': [-6.7714, -79.8409], '15': [-12.0464, -77.0428],
  '16': [-3.7437, -73.2516], '17': [-12.5933, -69.1891], '18': [-17.1945, -70.9350],
  '19': [-10.6869, -76.2565], '20': [-5.1945, -80.6328], '21': [-15.8402, -70.0219],
  '22': [-6.4858, -76.3657], '23': [-18.0146, -70.2536], '24': [-3.5669, -80.4515],
  '25': [-8.3791, -74.5539],
};

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

export function puntoReferencialUbigeo(ubigeo: string): PuntoMapaFen | null {
  const centro = CENTROS_DEPARTAMENTO[ubigeo.slice(0, 2)];
  return centro ? { lat: centro[0], lng: centro[1], precision: 'departamento' } : null;
}

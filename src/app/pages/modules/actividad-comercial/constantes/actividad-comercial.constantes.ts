import type { DominioTablero } from '../models/actividad-comercial.model';

export const TITULO_TABLERO = 'Tablero de Mando - Asesor';

/** Orden de las tarjetas (3 columnas × 2 filas). */
export const DOMINIOS_TABLERO: readonly { clave: DominioTablero; titulo: string }[] = [
  { clave: 'desempeno', titulo: 'Desempeño' },
  { clave: 'desembolsos', titulo: 'Desembolsos' },
  { clave: 'mora', titulo: 'Recuperaciones y Mora' },
  { clave: 'seguros', titulo: 'Seguros' },
  { clave: 'cartera', titulo: 'Cartera' },
  { clave: 'clientes', titulo: 'Clientes' },
];

/** Retardo simulado de la consulta mientras los datos son de ejemplo. */
export const RETARDO_DEMO_MS = 250;

/** Colores del radar (Highcharts no lee variables CSS): navy y naranja corporativos. */
export const COLOR_RADAR_ASESOR = '#0A4681';
export const COLOR_RADAR_PROMEDIO = '#F28F16';

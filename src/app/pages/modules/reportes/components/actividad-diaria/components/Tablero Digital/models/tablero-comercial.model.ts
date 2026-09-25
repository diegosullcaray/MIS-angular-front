import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';

/**
 * Semáforos que el legado calcula en el cliente (`trafficFn` de `usa_come.util.ts`): columna
 * visible → clave de la fila donde `semaforosTableroComercial()` deja el -1/0/1.
 */
export const SEMAFOROS_TABLERO_COMERCIAL = {
  /** "N° Enrolado · Var. TMF-1" — `colorFn`: verde si no baja. */
  var_enro: 'sem_var_enro',
  /** "% Usabilidad Meta · Cumplimiento" — `tlFn`. */
  cumplUsa: 'sem_cumplUsa',
  /** "% Usabilidad Cartera Meta · Cumplimiento" — `tlFn`. */
  cumplUsaCar: 'sem_cumplUsaCar',
} as const;

const cifra = (label: string, key: string, semaforoKey?: string): ColumnaDinamica => ({
  label,
  key,
  format: { type: 'integer' },
  cellStyle: { 'text-align': 'right' },
  ...(semaforoKey ? { semaforoKey } : {}),
});

const porcentaje = (label: string, key: string, semaforoKey?: string): ColumnaDinamica => ({
  label,
  key,
  format: { type: 'percent' },
  cellStyle: { 'text-align': 'right' },
  ...(semaforoKey ? { semaforoKey } : {}),
});

/**
 * Columnas de "Tablero Digital Comercial" diario, tal cual el `tblHeaders` estático del legado
 * (`repositorio/usabilidad_comercial/usa_come.util.ts`). El legado NO usa los `headers` que
 * devuelve `RS_TAB_COM_01`: pinta estas columnas sobre `resultado.data`.
 */
export const COLUMNAS_TABLERO_COMERCIAL: ColumnaDinamica[] = [
  { label: 'Descripción', key: 'descripcion', cellStyle: { 'min-width': '250px' } },
  {
    label: 'Avance Mes',
    key: 'avance_mes',
    subs: [
      cifra('Cartera', 'num_cli_stock_2'),
      {
        label: 'N° Enrolado',
        key: 'n_enrolado',
        subs: [cifra('Mes', 'num_enro_2'), cifra('Var. TMF-1', 'var_enro', SEMAFOROS_TABLERO_COMERCIAL.var_enro)],
      },
      {
        label: '% Enrolado',
        key: 'p_enrolado',
        subs: [porcentaje('Mes', 'percent_enro'), porcentaje('Var.TMF-1', 'var_percent_enro')],
      },
      {
        label: 'N° Usabilidad',
        key: 'n_usabilidad',
        subs: [cifra('Mes', 'num_usab_2'), cifra('Var.TMF-1', 'var_usabili')],
      },
      {
        label: '% Usabilidad',
        key: 'p_usabilidad',
        subs: [porcentaje('Mes', 'percent_usa'), porcentaje('Var.TMF-1', 'var_percent_usa')],
      },
      {
        label: '% Usabilidad Meta',
        key: 'p_usabilidad_meta',
        subs: [porcentaje('Mes', 'met_usa'), porcentaje('Cumplimiento', 'cumplUsa', SEMAFOROS_TABLERO_COMERCIAL.cumplUsa)],
      },
      {
        label: '% Usabilidad Cartera',
        key: 'p_usabilidad_cartera',
        subs: [porcentaje('Mes', 'percen_usa_cart'), porcentaje('Var.TMF-1', 'var_perce_usa_carte')],
      },
      {
        label: '% Usabilidad Cartera Meta',
        key: 'p_usabilidad_cartera_meta',
        subs: [
          porcentaje('Mes', 'met_usa_cartera'),
          porcentaje('Cumplimiento', 'cumplUsaCar', SEMAFOROS_TABLERO_COMERCIAL.cumplUsaCar),
        ],
      },
    ],
  },
];

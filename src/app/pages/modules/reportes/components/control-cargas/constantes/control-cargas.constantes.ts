/** Constantes de Control de Cargas (`leg/prd`). */

/** Mismo `cod_rep` para las dos tablas: las diferencia el filtro `opt`. */
export const COD_CONTROL_CARGAS = 'RS_MON_CAR_01';

/** `opt: 2` son las fuentes de producción; `opt: 1`, los procesos diarios. */
export const OPCION_CONTROL_CARGAS = { produccion: 2, procesos: 1 } as const;

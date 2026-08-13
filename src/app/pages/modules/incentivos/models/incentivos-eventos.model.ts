import type { ItemAvance, ItemSuperPlus } from './incentivos-tablas.model';

/** Evento emitido al hacer clic en una variable de la tabla. */
export interface DetalleTablaVariableEvent {
  codVar: number;
  titulo: string;
  icono: string;
}

/** Evento emitido al hacer clic en un ítem de la grilla Super Plus. */
export interface DetalleSuperPlusEvent {
  item: ItemSuperPlus;
  codVar: number;
}

/** Evento emitido al hacer clic en un ítem de la grilla de Avances. */
export interface DetalleAvanceEvent {
  item: ItemAvance;
  codVar: number;
}

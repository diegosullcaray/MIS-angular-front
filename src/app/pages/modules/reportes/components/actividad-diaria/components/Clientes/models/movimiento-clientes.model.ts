import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';

/** Un bloque de tabla dentro de una pestaña: su título y el `gru` que lo alimenta. */
export interface BloqueMovimiento {
  gru: number;
  titulo: string;
  /** Llamadas al pie del bloque, tal cual las lista el legado. */
  notas?: string[];
}

export interface PestanaMovimiento {
  id: string;
  titulo: string;
  bloques: BloqueMovimiento[];
}

/**
 * `MOVIMIENTO_CLIENTES_01` trae todas las filas juntas y el legado las reparte
 * por su columna `gru` (`rep01-movimiento-clientes.component.ts`). Este es ese
 * reparto, en el mismo orden que la plantilla del legado.
 *
 * El `gru` 5 se pide pero el legado nunca lo pinta, así que no aparece acá.
 */
export const PESTANAS_MOVIMIENTO_CLIENTES: readonly PestanaMovimiento[] = [
  {
    id: 'carteras',
    titulo: 'Carteras',
    bloques: [
      {
        gru: 1,
        titulo: 'Clientes Activo',
        notas: [
          '1/ Clientes Nuevos del mes: clientes que no se encontraban en el stock desde May-13.',
          '2/ Clientes Recuperados: aquellos clientes que han tenido alguna operación desde May-13 y que han desembolsado en el mes en curso.',
          '3/ Clientes que se encontraban en la cartera del mes anterior y en la cartera del mes actual no figuran.',
        ],
      },
      { gru: 2, titulo: 'Clientes Pasivo' },
      { gru: 3, titulo: 'Clientes Compartido' },
      {
        gru: 4,
        titulo: 'Clientes Neto',
        notas: [
          '4/ Clientes Nuevos del mes: clientes que no se encontraban en el stock del mes anterior.',
          '5/ Clientes con 12 meses de inactividad y con saldo menor igual a S/ 1.',
          '6/ Clientes con 12 meses de inactividad y con saldo mayor a S/ 1.',
          '7/ Clientes del pasivo neto: considera todos los clientes del pasivo sin considerar los clientes inactivos cuyo saldo sea menor o igual a S/ 1 (nota 5/).',
          '8/ Clientes compartidos que tienen cuentas de productos pasivos con 12 meses de inactividad y con saldo menor o igual a S/ 1 (no se consideran clientes netos del pasivo).',
        ],
      },
      { gru: 11, titulo: 'Clientes Rurales Activo' },
    ],
  },
  {
    id: 'producto',
    titulo: 'Producto',
    bloques: [
      { gru: 7, titulo: 'Clientes por Producto Comercial' },
      { gru: 8, titulo: 'Clientes Castigados por Producto Comercial' },
    ],
  },
  {
    id: 'genero',
    titulo: 'Género',
    bloques: [
      { gru: 6, titulo: 'Clientes Mujeres' },
      { gru: 9, titulo: 'Clientes por Género' },
      { gru: 10, titulo: 'Clientes Castigados por Género' },
    ],
  },
];

/** Todas las tablas comparten un único juego de columnas; solo cambian las filas. */
export interface MovimientoClientesResultado {
  columnas: ColumnaDinamica[];
  /** Filas por `gru`. */
  grupos: Record<number, Record<string, unknown>[]>;
}

export const MOVIMIENTO_CLIENTES_VACIO: MovimientoClientesResultado = { columnas: [], grupos: {} };

import type { FilaCarteraCreditosComposicion, FilaCarteraCreditosVariables, IdProductoComposicion } from '../models/cartera-creditos.model';

/**
 * Ids de negocio de los 11 productos de la composición por producto (tabs
 * "Comp. Prod. Monto"/"Comp. Prod. Ratio", claves `d_<id>`/`g_<id>`) — no son
 * consecutivos (`18`/`99` en vez de `10`/`11`), tal cual el legado
 * (`pre-act-cartera-creditos.util.ts`). La correspondencia etiqueta↔id se
 * preserva en el mismo orden en que aparecía en el legado, pero no hay forma
 * de verificarla 1:1 contra el código fuente real (no estaba en el volcado
 * de referencia) — ajustar si el backend real no calza.
 */
export const PRODUCTOS_COMPOSICION: ReadonlyArray<{ id: IdProductoComposicion; label: string }> = [
  { id: '1', label: 'Agropecuario' },
  { id: '2', label: 'Construyendo Confianza' },
  { id: '3', label: 'Crédito Educativo' },
  { id: '4', label: 'Emprendiendo Confianza' },
  { id: '5', label: 'Iniciando Confianza PYME' },
  { id: '6', label: 'Palabra de Mujer' },
  { id: '7', label: 'Iniciando Oficios' },
  { id: '8', label: 'Consumo' },
  { id: '9', label: 'Garantía Líquida' },
  { id: '18', label: 'Trabajadores FC' },
  { id: '99', label: 'Otros' },
];

/**
 * Replica el `editCell(evt)` especial de Cartera Créditos para "Asesores
 * Nuevos" (`b1`) / "Asesores en Producción" (`b2`): un asesor nuevo tarda 2
 * periodos en convertirse en "en producción", y el acumulado se arrastra
 * periodo a periodo (`b2[i] = b1[i-2] + b2[i-1]`).
 *
 * Devuelve el índice desde el cual debe correr la cascada principal
 * (`calcularFilaCarteraCreditos`) — distinto según la columna editada, igual
 * que `this.calculate(...)` en el legado.
 */
export function aplicarCascadaAsesores(
  filas: FilaCarteraCreditosVariables[],
  idxEditado: number,
  key: string
): number {
  if (key === 'b1') {
    for (let i = idxEditado + 2; i < filas.length; i++) {
      const aseNuevos = Number(filas[i - 2]['b1'] ?? 0);
      const aseEnProduccion = Number(filas[i - 1]['b2'] ?? 0);
      filas[i]['b2'] = aseNuevos + aseEnProduccion;
    }
    return idxEditado + 2;
  }

  if (key === 'b2') {
    for (let i = idxEditado + 1; i < filas.length; i++) {
      const aseNuevos = Number(filas[i - 2]?.['b1'] ?? 0);
      const aseEnProduccion = Number(filas[i - 1]['b2'] ?? 0);
      filas[i]['b2'] = aseNuevos + aseEnProduccion;
    }
    return idxEditado;
  }

  return idxEditado;
}

/**
 * Fórmula de negocio completa de una fila de Cartera Créditos
 * (`calculateRow` del legado) — recalcula las columnas derivadas de
 * Variables y, con el mismo monto desembolsado, la composición por producto.
 */
export function calcularFilaCarteraCreditos(
  filasVariables: FilaCarteraCreditosVariables[],
  filasComposicion: FilaCarteraCreditosComposicion[],
  idx: number
): void {
  const fila = filasVariables[idx];

  const aseOpe = Number(fila['b2'] ?? 0); // Asesores en Producción
  const prodAse = Number(fila['b3'] ?? 0); // Productividad por Asesor
  const opeDes = Math.floor(aseOpe * prodAse); // Operaciones Desembolsadas
  fila['b4'] = opeDes;

  const tickProm = Number(fila['b5'] ?? 0); // Ticket Promedio
  const monDes = tickProm * opeDes; // Monto Desembolsado
  fila['b6'] = monDes;

  const salIni = Number(fila['a1'] ?? 0); // Saldo Inicial
  const ratCan = Number(fila['c1'] ?? 0); // Ratio Cancelación
  const monCan = salIni * ratCan; // Monto Cancelado
  fila['c2'] = monCan;

  const salCas = Number(fila['a2'] ?? 0); // Saldo Castigado
  const salFin = salIni + monDes - monCan - salCas; // Saldo Cierre
  fila['a3'] = salFin;

  if (idx + 1 < filasVariables.length) {
    filasVariables[idx + 1]['a1'] = salFin;
  }

  const filaComposicion = filasComposicion[idx];
  if (filaComposicion) {
    for (const producto of PRODUCTOS_COMPOSICION) {
      const ratio = Number(filaComposicion[`g_${producto.id}`] ?? 0);
      filaComposicion[`d_${producto.id}`] = ratio * monDes;
    }
  }
}

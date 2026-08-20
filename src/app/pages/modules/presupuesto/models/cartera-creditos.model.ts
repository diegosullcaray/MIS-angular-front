import type { FilaLineaSimple, ResumenMetadata } from './linea-simple.model';

/** Fila de la tab "Variables" de Cartera Créditos. */
export interface FilaCarteraCreditosVariables extends FilaLineaSimple {
  a1: number; // Saldo Inicial
  a2: number; // Saldo Castigado
  a3: number; // Saldo Cierre (calculado)
  b1: number; // Asesores Nuevos
  b2: number; // Asesores en Producción
  b3: number; // Productividad por Asesor
  b4: number; // Operaciones Desembolsadas (calculado)
  b5: number; // Ticket Promedio
  b6: number; // Monto Desembolsado (calculado)
  c1: number; // Ratio Cancelación
  c2: number; // Monto Cancelado (calculado)
}

/** Ids de negocio de los 11 productos de la composición por producto — no son consecutivos (`18`/`99`). */
export type IdProductoComposicion = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '18' | '99';

/** Fila de las tabs "Comp. Prod. Monto"/"Comp. */
export type FilaCarteraCreditosComposicion = FilaLineaSimple &
  { [K in IdProductoComposicion as `d_${K}`]?: number } &
  { [K in IdProductoComposicion as `g_${K}`]?: number };

/** Respuesta de Cartera Créditos — además de `ws`/`bp`, trae la composición por producto (`cs`). */
export interface ResumenCarteraCreditos {
  ws: FilaCarteraCreditosVariables[];
  cs: FilaCarteraCreditosComposicion[];
  bp: ResumenMetadata;
}

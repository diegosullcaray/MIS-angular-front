import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService } from '../../../../../services/bloque-reporte.service';
import { type MovimientoClientesResultado } from '../models/movimiento-clientes.model';

/**
 * "Movimiento de Clientes" — legado `repositorio/movimiento-clientes`.
 *
 * Es el único de Clientes sin jerarquía: el legado tiene el `hier-rem-selector`
 * comentado y pide el reporte con parámetros vacíos.
 */
@Injectable({ providedIn: 'root' })
export class MovimientoClientesService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(): Observable<MovimientoClientesResultado> {
    return this.bloques.tablaRegularCon('MOVIMIENTO_CLIENTES_01').pipe(
      map(({ columnas, filas }) => ({ columnas, grupos: agruparPorGru(filas) })),
    );
  }
}

/** Reparte las filas por su columna `gru`, que es lo que separa una tabla de otra. */
function agruparPorGru(filas: Record<string, unknown>[]): Record<number, Record<string, unknown>[]> {
  const grupos: Record<number, Record<string, unknown>[]> = {};
  for (const fila of filas) {
    const gru = Number(fila['gru']);
    if (Number.isNaN(gru)) continue;
    (grupos[gru] ??= []).push(fila);
  }
  return grupos;
}

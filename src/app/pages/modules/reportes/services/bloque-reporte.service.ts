import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { mapearBloqueReporte } from '../utils/reportes-mapeo.util';
import { fechaCorteCompacta } from '../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../models/jerarquia.model';
import type { TablaReporteResultado } from '../models/tabla-reporte.model';

/** Nodo de jerarquía reducido a lo que viaja como parámetro del reporte. */
export type NodoConsulta = Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>;

/**
 * Acceso a los bloques del motor de reportes "mixtos".
 *
 * Centraliza lo que cada reporte repetía: resolver el `fec` de corte, armar los
 * parámetros del nodo y mapear la respuesta cruda. Los `cod_rep` y filtros
 * propios los pone cada service de reporte.
 */
@Injectable({ providedIn: 'root' })
export class BloqueReporteService {
  private readonly reportes = inject(ModReportesService);
  private readonly shell = inject(ShellStateService);

  /** Fecha de corte declarada por el backend (`curr_fec`), en `YYYYMMDD`. */
  fec(): string {
    return fechaCorteCompacta(this.shell.usuarioActivo()?.fechaCorte);
  }

  /** Un bloque del strand `regularData`. */
  regular(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    return this.reportes.getRegularData(codRep, { ...nodo, fec: this.fec(), ...extra }).pipe(map(mapearBloqueReporte));
  }

  /** Varios bloques `regularData` en paralelo, con los mismos parámetros salvo los `extra` de cada uno. */
  regulares(
    bloques: readonly { codRep: string; extra?: Record<string, unknown> }[],
    nodo: NodoConsulta,
  ): Observable<TablaReporteResultado[]> {
    return forkJoin(bloques.map((b) => this.regular(b.codRep, nodo, b.extra)));
  }

  /** Un bloque del strand "deprecado" (`reportData`) — reportes cuya entrada de `cra-map.ts` no declara `reportType`. */
  deprecado(codRep: string, nodo: NodoConsulta, extra: Record<string, unknown> = {}): Observable<TablaReporteResultado> {
    return this.reportes.getDeprecatedData(codRep, { ...nodo, fec: this.fec(), ...extra }).pipe(map(mapearBloqueReporte));
  }
}

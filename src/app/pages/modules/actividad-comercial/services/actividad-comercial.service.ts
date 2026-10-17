import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Observable, Subscription, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { fechaCorteJerarquia } from '../../../../shared/ui/hier-selector/fecha-corte.util';
import type { HierarquiaNodo } from '../../../../shared/ui/hier-selector/jerarquia.model';
import { COD_TABLERO_SEGUIMIENTO } from '../constantes/actividad-comercial.constantes';
import type { TableroAsesor } from '../models/actividad-comercial.model';
import { mapearTablero, type FilaTablero } from '../utils/tablero-seguimiento.mapeo.util';

/** Entidad que se consulta: el nodo elegido en la jerarquía. */
export type NodoTablero = Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel' | 'des_rel' | 'desc_rel'>;

/**
 * Fachada del Tablero de Seguimiento. Pide el reporte `TAB_SEG_01` (una fila por entidad) con el corte del usuario
 * y lo convierte en el modelo de vista.
 */
@Injectable()
export class ActividadComercialService {
  private readonly reportes = inject(ModReportesService);
  private readonly shell = inject(ShellStateService);

  private readonly tableroState = signal<TableroAsesor | null>(null);
  private readonly cargandoState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly vacioState = signal(false);
  private consulta?: Subscription;

  readonly tablero = this.tableroState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly error = this.errorState.asReadonly();
  /** La consulta respondió bien pero la entidad no devolvió fila. */
  readonly vacio = this.vacioState.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.consulta?.unsubscribe());
  }

  /** Origen de los datos. Nulo = el reporte no devolvió fila. */
  protected obtener(nodo: NodoTablero): Observable<TableroAsesor | null> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: fechaCorteJerarquia(this.shell.usuarioActivo()?.fechaCorte) };
    return this.reportes.getRegularTableResult(COD_TABLERO_SEGUIMIENTO, params).pipe(
      map((respuesta) => {
        const filas = (respuesta.body as { resultado?: { data?: FilaTablero[] } } | null)?.resultado?.data;
        return filas?.[0] ? mapearTablero(filas[0], nodo.des_rel ?? nodo.desc_rel ?? nodo.cod_rel) : null;
      }),
    );
  }

  /** Pide el tablero de la entidad; una consulta nueva cancela la anterior. */
  consultar(nodo: NodoTablero): void {
    this.consulta?.unsubscribe();
    this.cargandoState.set(true);
    this.errorState.set(null);
    this.vacioState.set(false);
    this.tableroState.set(null);

    this.consulta = this.obtener(nodo).subscribe({
      next: (tablero) => {
        this.tableroState.set(tablero);
        this.vacioState.set(tablero === null);
        this.cargandoState.set(false);
      },
      error: () => {
        this.errorState.set('No se pudo cargar el tablero. Inténtalo de nuevo.');
        this.cargandoState.set(false);
      },
    });
  }
}

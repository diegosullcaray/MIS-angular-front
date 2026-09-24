import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, map } from 'rxjs';
import { ActividadesService } from '../../actividades/services/actividades.service';
import type { ProspectoFila, ProspectoResponseBody } from '../models/prospecto.model';
import { mapProspectoFilas } from '../utils/prospecto.util';

/**
 * Fachada de datos de Prospecto.
 */
@Injectable({ providedIn: 'root' })
export class ProspectoService {
  private readonly ant = inject(ActividadesService);
  private consulta?: Subscription;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.consulta?.unsubscribe());
  }

  private readonly _filas = signal<ProspectoFila[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly filas = this._filas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalRegistros = computed(() => this._filas().length);
  /** Vacío verdadero: respondió bien y no hay filas. Distinto de un error. */
  readonly vacio = computed(() => !this._cargando() && !this._error() && this._filas().length === 0);

  consultar(parametros: Record<string, unknown> = {}): void {
    this.consulta?.unsubscribe();
    this._filas.set([]);
    this._cargando.set(true);
    this._error.set(null);

    this.consulta = this.ant.getRegResultadosListProsp(parametros['cod_bt'] as string | undefined).pipe(
      map((respuesta) => {
        const cuerpo = respuesta.body as ProspectoResponseBody | null;
        return mapProspectoFilas(cuerpo?.resultado?.result);
      }),
    ).subscribe({
      next: (filas) => {
        this._filas.set(filas);
        this._cargando.set(false);
      },
      // El error NO se convierte en tabla vacía: confundirlos es el bug que
      // degradó al sistema legado (ver evidence/performance/legacy-comparison).
      error: () => {
        this._filas.set([]);
        this._error.set('No se pudo obtener la información. Reintentá en unos segundos.');
        this._cargando.set(false);
      },
    });
  }

  limpiar(): void {
    this.consulta?.unsubscribe();
    this._filas.set([]);
    this._cargando.set(false);
    this._error.set(null);
  }
}

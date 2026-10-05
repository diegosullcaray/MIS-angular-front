import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { COD_ACTIVIDAD_COMERCIAL } from '../constantes/actividad-comercial.constantes';
import type { ActividadComercialFila, ActividadComercialResponseBody } from '../models/actividad-comercial.model';
import { mapActividadComercialFilas, totalActividadComercial } from '../utils/actividad-comercial.util';

/**
 * Fachada de datos de Actividad Comercial.
 *
 * Habla con el backend Ant a través de `ModReportesService` (transporte
 * Winder), no con un endpoint REST: es el borde que el resto del sistema usa.
 * Si este módulo consumiera una API Host directa, habría que inyectar
 * HttpClient — y documentar a qué frontera pertenece, según
 * governance/docs/architecture/data-flow.md.
 */
@Injectable({ providedIn: 'root' })
export class ActividadComercialService {
  private readonly ant = inject(ModReportesService);
  private consulta?: Subscription;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.consulta?.unsubscribe());
  }

  private readonly _filas = signal<ActividadComercialFila[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly filas = this._filas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalRegistros = computed(() => this._filas().length);
  readonly totalMonto = computed(() => totalActividadComercial(this._filas()));
  /** Vacío verdadero: respondió bien y no hay filas. Distinto de un error. */
  readonly vacio = computed(() => !this._cargando() && !this._error() && this._filas().length === 0);

  consultar(parametros: Record<string, unknown> = {}): void {
    this.consulta?.unsubscribe();
    this._filas.set([]);
    this._cargando.set(true);
    this._error.set(null);

    this.consulta = this.ant.getRegularTableResult(COD_ACTIVIDAD_COMERCIAL, parametros).pipe(
      map((respuesta) => {
        const cuerpo = respuesta.body as ActividadComercialResponseBody | null;
        return mapActividadComercialFilas(cuerpo?.resultado?.data);
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

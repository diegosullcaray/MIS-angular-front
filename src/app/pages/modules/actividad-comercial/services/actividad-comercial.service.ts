import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Observable, Subscription, delay, of } from 'rxjs';
import { RETARDO_DEMO_MS } from '../constantes/actividad-comercial.constantes';
import { TABLERO_DEMO } from '../constantes/actividad-comercial-demo.constantes';
import type { TableroAsesor } from '../models/actividad-comercial.model';

/**
 * Fachada del Tablero de Mando del asesor. Por ahora responde datos de ejemplo (sin backend);
 * cuando exista el contrato, solo cambia `obtener()` por un `Mod*Service` y el resto queda igual.
 */
@Injectable()
export class ActividadComercialService {
  private readonly tableroState = signal<TableroAsesor | null>(null);
  private readonly cargandoState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private consulta?: Subscription;

  readonly tablero = this.tableroState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.consulta?.unsubscribe());
  }

  /** Origen de los datos. Punto único a reemplazar por la consulta real. */
  protected obtener(): Observable<TableroAsesor> {
    return of(TABLERO_DEMO).pipe(delay(RETARDO_DEMO_MS));
  }

  /** Pide el tablero; una consulta nueva cancela la anterior. */
  consultar(): void {
    this.consulta?.unsubscribe();
    this.cargandoState.set(true);
    this.errorState.set(null);

    this.consulta = this.obtener().subscribe({
      next: (tablero) => {
        this.tableroState.set(tablero);
        this.cargandoState.set(false);
      },
      error: () => {
        this.errorState.set('No se pudo cargar el tablero. Inténtalo de nuevo.');
        this.cargandoState.set(false);
      },
    });
  }
}

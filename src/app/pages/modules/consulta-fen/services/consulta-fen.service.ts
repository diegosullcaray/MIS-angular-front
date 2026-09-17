import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { campoSugerenciaFen, COD_REPORTE_FEN } from '../constantes/consulta-fen.constantes';
import type { ColumnaFiltroFen, ColumnaTextoFen, FilaRiesgoFen, RespuestaFenBody } from '../models/consulta-fen.model';
import { mapearFilasFen } from '../utils/consulta-fen.util';

@Injectable({ providedIn: 'root' })
export class ConsultaFenService {
  private readonly reportes = inject(ModReportesService);
  private readonly filasState = signal<FilaRiesgoFen[]>([]);
  private readonly cargandoState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly consultadoState = signal(false);
  private consulta?: Subscription;

  readonly filas = this.filasState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly consultado = this.consultadoState.asReadonly();
  readonly vacio = computed(() => this.consultado() && !this.cargando() && !this.error() && this.filas().length === 0);

  consultar(columna: ColumnaFiltroFen, valor: string): void {
    this.consulta?.unsubscribe();
    this.cargandoState.set(true);
    this.errorState.set(null);
    this.consultadoState.set(true);
    this.filasState.set([]);

    this.consulta = this.reportes.getRegularTableResult(COD_REPORTE_FEN, { col: columna, val: valor }).subscribe({
      next: (respuesta) => {
        const data = (respuesta.body as RespuestaFenBody | null)?.resultado?.data;
        const filas = mapearFilasFen(data);
        if (filas === null) {
          this.errorState.set('La respuesta de Consulta FEN tiene un formato inválido.');
        } else {
          this.filasState.set(filas);
        }
        this.cargandoState.set(false);
      },
      error: () => {
        this.errorState.set('No se pudo realizar la consulta. Intenta nuevamente.');
        this.cargandoState.set(false);
      },
    });
  }

  /** Sugerencias del mismo contrato legado; un fallo aquí no altera la consulta vigente. */
  sugerir(columna: ColumnaTextoFen, valor: string): Observable<string[]> {
    const campo = campoSugerenciaFen(columna);
    return this.reportes.getRegularTableResult(COD_REPORTE_FEN, { col: columna, val: valor }).pipe(
      map((respuesta) => {
        const filas = mapearFilasFen((respuesta.body as RespuestaFenBody | null)?.resultado?.data);
        return filas ? [...new Set(filas.map((fila) => fila[campo]).filter(Boolean))].slice(0, 8) : [];
      }),
    );
  }

  mostrarErrorValidacion(mensaje: string): void {
    this.filasState.set([]);
    this.consultadoState.set(true);
    this.cargandoState.set(false);
    this.errorState.set(mensaje);
  }

  limpiar(): void {
    this.consulta?.unsubscribe();
    this.filasState.set([]);
    this.cargandoState.set(false);
    this.errorState.set(null);
    this.consultadoState.set(false);
  }
}

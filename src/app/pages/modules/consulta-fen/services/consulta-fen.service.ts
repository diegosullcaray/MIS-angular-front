import { Injectable, computed, inject, signal } from '@angular/core';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { COD_REPORTE_FEN } from '../constantes/consulta-fen.constantes';
import type { FilaRiesgoFen, RespuestaFenBody } from '../models/consulta-fen.model';
import { mapearFilasFen } from '../utils/consulta-fen.util';

@Injectable({ providedIn: 'root' })
export class ConsultaFenService {
  private readonly reportes = inject(ModReportesService);
  private readonly filasState = signal<FilaRiesgoFen[]>([]);
  private readonly cargandoState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly filas = this.filasState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly consultado = signal(false);
  readonly vacio = computed(() => this.consultado() && !this.cargando() && !this.error() && this.filas().length === 0);

  consultar(columna: 0 | 3, valor: string): void {
    this.cargandoState.set(true);
    this.errorState.set(null);
    this.consultado.set(true);
    this.filasState.set([]);

    this.reportes.getRegularTableResult(COD_REPORTE_FEN, { col: columna, val: valor }).subscribe({
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

  mostrarErrorValidacion(mensaje: string): void {
    this.filasState.set([]);
    this.consultado.set(true);
    this.cargandoState.set(false);
    this.errorState.set(mensaje);
  }
}

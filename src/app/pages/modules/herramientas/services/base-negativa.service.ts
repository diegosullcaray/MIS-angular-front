import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import type { BaseNegativaBusquedaFila, TableHeaderDef } from '../models/base-negativa.model';
import type { BaseNegativaResponseBody } from '../models/base-negativa-api.model';

/** Código de reporte del SP `RS_BASE_NEG_01` (legado: `basenegativa.component.ts`/`buscador.component.ts`). */
const COD_REP = 'RS_BASE_NEG_01';

/** Fachada de "Consulta Base Negativa" (`/app/cons_base_negativa`, herramientas) — busca un cliente en la base de riesgos y muestra su detalle (venta/castigo). */
@Injectable({ providedIn: 'root' })
export class BaseNegativaService {
  private readonly ant = inject(ModReportesService);

  readonly resultados = signal<Record<string, unknown>[]>([]);
  readonly headers = signal<TableHeaderDef[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** Búsqueda en vivo para el diálogo de selección (columnas fijas: cuenta, nombre, fecha, tipo). */
  buscar(termino: string): Observable<BaseNegativaBusquedaFila[]> {
    return this.ant.getRegularTableResult(COD_REP, { nom: termino }).pipe(
      map((response) => {
        const body = response.body as BaseNegativaResponseBody | null;
        return (body?.resultado?.data as BaseNegativaBusquedaFila[]) ?? [];
      })
    );
  }

  /** Carga el detalle del cliente/código elegido — columnas dinámicas (`resultado.headers`). */
  consultar(codigo: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.ant.getRegularTableResult(COD_REP, { nom: codigo }).subscribe({
      next: (response) => {
        const body = response.body as BaseNegativaResponseBody | null;
        const resultado = body?.resultado;

        this.resultados.set((resultado?.data as Record<string, unknown>[]) ?? []);
        this.headers.set(resultado?.headers ? (JSON.parse(resultado.headers) as TableHeaderDef[]) : []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar el resultado de la consulta.');
        this.cargando.set(false);
      },
    });
  }

  limpiar(): void {
    this.resultados.set([]);
    this.headers.set([]);
    this.cargando.set(false);
    this.error.set(null);
  }
}

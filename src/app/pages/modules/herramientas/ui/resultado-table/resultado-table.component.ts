import { Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import type { TableHeaderDef } from '../../models/base-negativa.model';

/**
 * Tabla de resultados de "Consulta Base Negativa" — columnas dinámicas
 * (`resultado.headers` del backend), igual que el `stg-table` genérico del
 * legado (`basenegativa.component.ts`: `this.headerDefs = JSON.parse(r.headers)`).
 */
@Component({
  selector: 'app-resultado-table',
  standalone: true,
  imports: [TableModule, SkeletonModule],
  templateUrl: './resultado-table.component.html',
  styleUrl: './resultado-table.component.css',
})
export class ResultadoTableComponent {
  readonly columnas = input<TableHeaderDef[]>([]);
  readonly filas = input<Record<string, unknown>[]>([]);
  readonly cargando = input(false);
}

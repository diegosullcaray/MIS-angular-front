import { Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import type { EsgMetricaFila } from '../../models';

/** Columna fija que precede a las columnas históricas dinámicas de cada categoría. */
interface ColumnaFija {
  key: string;
  label: string;
}

const COLUMNAS_FIJAS: ColumnaFija[] = [
  { key: 'des_met', label: 'Metrica' },
  { key: 'des_med', label: 'Medida' },
  { key: 'des_dis', label: 'Esta disponible?' },
];

/**
 * Tabla de métricas de una categoría ESG (Medioambiente, Social Empleados,
 * Social Clientes, Gobierno) — reemplaza al `stg-table2` legado
 * (`headOpt2`/`tblOpts2`, ver `framework-esg.util.ts` del legado STG).
 *
 * Columnas fijas (metrica/medida/disponibilidad) + columnas históricas
 * dinámicas que llegan por categoría (`resultado.cab.cols` de `esg.res_cat`,
 * ver `FrameworkEsgService.cargarResumenCategoria()`). Selección de una sola
 * fila — habilita los botones "Editar"/"Detalles" de `PrincipalComponent`.
 */
@Component({
  selector: 'app-categoria-metricas-tabla',
  standalone: true,
  imports: [TableModule, SkeletonModule],
  templateUrl: './categoria-metricas-tabla.component.html',
  styleUrl: './categoria-metricas-tabla.component.css',
})
export class CategoriaMetricasTablaComponent {
  readonly columnasHistoricas = input<string[]>([]);
  readonly filas = input<EsgMetricaFila[]>([]);
  readonly cargando = input(false);
  readonly filaSeleccionada = output<EsgMetricaFila>();

  protected readonly columnasFijas = COLUMNAS_FIJAS;

  protected readonly columnasHistoricasCol = computed(() => this.columnasHistoricas().map((clave) => ({ key: clave, label: clave })));

  protected onSeleccionFila(fila: unknown): void {
    if (fila && !Array.isArray(fila)) {
      this.filaSeleccionada.emit(fila as EsgMetricaFila);
    }
  }

  /** Trunca valores largos de columnas históricas — igual que `format.type: 'truncate', params.limit: 24` del legado. */
  protected truncar(valor: unknown): string {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    return texto.length > 24 ? `${texto.slice(0, 24)}…` : texto;
  }
}

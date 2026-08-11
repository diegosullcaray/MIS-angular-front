import { Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import type { EsgMetricaFila } from '../../models';

/** Columna fija que precede a las columnas históricas dinámicas de cada categoría. */
interface ColumnaFija {
  key: string;
  label: string;
  headerBg?: string;
}

const COLUMNAS_FIJAS: ColumnaFija[] = [
  { key: 'des_met', label: 'Metrica', headerBg: '#008080' },
  { key: 'des_med', label: 'Medida', headerBg: '#008080' },
  { key: 'des_dis', label: 'Esta disponible?', headerBg: '#4472c4' },
];

/**
 * Tabla de métricas de una categoría ESG (Medioambiente, Social Empleados,
 * Social Clientes, Gobierno) — reemplaza al `stg-table2` legado
 * (`headOpt2`/`tblOpts2`, ver `framework-esg.util.ts` del legado STG).
 *
 * Columnas fijas (metrica/medida/disponibilidad) + columnas históricas
 * dinámicas que llegan por categoría (`resultado.cab.cols` de `esg.res_cat`,
 * ver `FrameworkEsgService.cargarResumenCategoria()`) + una columna de
 * Acciones con los botones "Editar"/"Ver detalle" por fila (antes vivían en
 * el toolbar de `PrincipalComponent`, habilitados por selección).
 *
 * Las filas de agrupación (`is_nod===1`, ver `EsgMetricaFila`) se resaltan
 * con el mismo color que usaba el legado para distinguirlas como
 * subcabeceras de sección (`rsFn1` de `framework-esg.util.ts`).
 */
@Component({
  selector: 'app-categoria-metricas-tabla',
  standalone: true,
  imports: [TableModule, SkeletonModule, ButtonModule, TooltipModule],
  templateUrl: './categoria-metricas-tabla.component.html',
  styleUrl: './categoria-metricas-tabla.component.css',
})
export class CategoriaMetricasTablaComponent {
  readonly columnasHistoricas = input<string[]>([]);
  readonly filas = input<EsgMetricaFila[]>([]);
  readonly cargando = input(false);
  /** Admin del Host O admin/permiso propio del módulo — habilita el botón "Editar" por fila. */
  readonly puedeEditar = input(false);

  readonly editar = output<EsgMetricaFila>();
  readonly verDetalle = output<EsgMetricaFila>();

  protected readonly columnasFijas = COLUMNAS_FIJAS;

  protected readonly columnasHistoricasCol = computed(() => this.columnasHistoricas().map((clave) => ({ key: clave, label: clave })));

  protected onEditar(fila: EsgMetricaFila): void {
    this.editar.emit(fila);
  }

  protected onVerDetalle(fila: EsgMetricaFila): void {
    this.verDetalle.emit(fila);
  }

  /** Trunca valores largos de columnas históricas — igual que `format.type: 'truncate', params.limit: 24` del legado. */
  protected truncar(valor: unknown): string {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    return texto.length > 24 ? `${texto.slice(0, 24)}…` : texto;
  }
}

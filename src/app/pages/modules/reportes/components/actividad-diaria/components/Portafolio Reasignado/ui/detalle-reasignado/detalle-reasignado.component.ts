import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

/**
 * Filas por página del detalle: el `paginator_size` de `theme_tb3`, el tema de los bloques
 * paginados de `cra-v4`/`cra-v11`/`cra-v12`. El backend devuelve 30 filas por `pagen`; con 10 el
 * paginador calculaba mal las páginas.
 */
const POR_PAGINA = 30;

/**
 * La pestaña de detalle que comparten "Gestión de Cartera Reasignada" y
 * "Monitor Efectividades Reasignados": los mismos tres filtros comunes
 * (asesor, fecha de compromiso y última gestión), la tabla y el paginador
 * servidor, tal como los arma el host `cra-v11`/`cra-v12`.
 *
 * Los filtros propios de cada reporte se proyectan en `[filtros]`.
 */
@Component({
  selector: 'app-detalle-reasignado',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    PaginatorModule,
    SelectModule,
    TablaReporteComponent,
    GrupoFiltrosComponent,
  ],
  templateUrl: './detalle-reasignado.component.html',
})
export class DetalleReasignadoComponent {
  readonly tabla = input.required<TablaReporteResultado>();
  readonly cargando = input(false);
  /** Total de filas que declara el backend (`additional.Total`). */
  readonly total = input(0);
  readonly opcionesUltimaGestion = input<OpcionFiltro[]>([]);
  /**
   * Muestra Última Gestión, Fecha Compromiso y Asesor. `cra-v11` (Gestión de Cartera Reasignada)
   * no los configura nunca: su detalle solo depende del nivel y de los filtros del reporte.
   */
  readonly filtrosComunes = input(true);

  readonly asesor = model('');
  readonly fechaCompromiso = model<Date | null>(null);
  readonly ultimaGestion = model('TODO');
  readonly pagina = model(1);

  /** El legado solo consulta al pulsar "Buscar asesor", no mientras se escribe. */
  readonly buscarAsesor = output<void>();

  protected readonly porPagina = POR_PAGINA;

  protected get primeraFila(): number {
    return (this.pagina() - 1) * POR_PAGINA;
  }

  protected onPagina(evento: PaginatorState): void {
    this.pagina.set((evento.page ?? 0) + 1);
  }
}

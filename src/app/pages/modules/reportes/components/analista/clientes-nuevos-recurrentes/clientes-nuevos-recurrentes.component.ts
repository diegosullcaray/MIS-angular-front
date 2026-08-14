import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { ClientesNuevosRecurrentesService } from '../../../services/clientes-nuevos-recurrentes.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Clientes Nuevos y Recurrentes" — migrado de la ruta `leg/com/rda/sec/cli-nue-rec`
 * (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`,
 * config `rda/sectorista/clientes_nuevos_recurrente/cliente_nuevo_rec` en `crs-map.ts`).
 *
 * Mismo patrón de solo lectura que "Cartera"/"Clientes Producto" (asesor → N
 * tablas, sin pestañas ni formulario), pero con una única tabla.
 */
@Component({
  selector: 'app-clientes-nuevos-recurrentes',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, SkeletonModule, TablaReporteComponent],
  templateUrl: './clientes-nuevos-recurrentes.component.html',
  styleUrl: './clientes-nuevos-recurrentes.component.css',
})
export class ClientesNuevosRecurrentesComponent {
  private readonly servicio = inject(ClientesNuevosRecurrentesService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);

  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  constructor() {
    this.cargarAsesores();
  }

  private cargarAsesores(): void {
    this.servicio.obtenerAsesores().subscribe({
      next: (asesores) => this.asesores.set(asesores),
      error: () => this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.'),
    });
  }

  protected onAsesorSeleccionado(asesor: AsesorSec | null): void {
    this.asesorSeleccionado.set(asesor);
    if (!asesor) return;

    this.cargando.set(true);
    this.servicio.obtenerClientesNuevosRecurrentes({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.mensajes.warn('Este asesor no tiene clientes nuevos ni recurrentes, o los datos podrían seguir procesándose.', 'Sin resultados');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

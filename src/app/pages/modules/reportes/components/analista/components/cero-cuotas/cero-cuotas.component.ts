import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { CeroCuotasService } from '../../services/cero-cuotas.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Cero Cuotas" — migrado de la ruta `leg/com/rda/sec/zu-cuo` (legado STG,
 * título real "Cero y Una Cuota",
 * `reportes/legacy/support/components/template/crs/report-crs-v1`, config
 * `rda/sectorista/cero_cuota/cero_cuota_sec` en `crs-map.ts`).
 *
 * Solo lectura: asesor → 1 tabla. El mensaje `content.lower` del legado
 * ("¡Urgente gestión! estos son los clientes de tu cartera que no han
 * pagado ni una cuota.") se muestra como nota debajo de la tabla.
 */
@Component({
  selector: 'app-cero-cuotas',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, SkeletonModule, TablaReporteComponent],
  templateUrl: './cero-cuotas.component.html',
  styleUrl: './cero-cuotas.component.css',
})
export class CeroCuotasComponent {
  private readonly servicio = inject(CeroCuotasService);
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
    this.servicio.obtenerCeroCuotas({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.mensajes.warn('Este asesor no tiene clientes con cero o una cuota impaga.', 'Sin resultados');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

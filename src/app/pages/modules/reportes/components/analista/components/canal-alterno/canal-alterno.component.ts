import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { CanalAlternoService } from '../../services/canal-alterno.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import { filtrarFilas } from '../../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Canal Alterno" — migrado de la ruta `leg/com/rda/sec/canal_alt` (legado
 * STG, `reportes/legacy/support/components/template/crs/report-crs-v1`,
 * config `rda/sectorista/canal_alt/canal_alt_sec` en `crs-map.ts`).
 *
 * Solo lectura: asesor → 1 tabla, con buscador de texto libre
 * (`filter_input: true` del legado, filtra localmente por substring en
 * cualquier columna — legado `table-multiheader.component.html`, `applyFilter()`).
 */
@Component({
  selector: 'app-canal-alterno',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, InputTextModule, SkeletonModule, TablaReporteComponent],
  templateUrl: './canal-alterno.component.html',
  styleUrl: './canal-alterno.component.css',
})
export class CanalAlternoComponent {
  private readonly servicio = inject(CanalAlternoService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);
  protected readonly busqueda = signal('');

  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly filasFiltradas = computed(() => filtrarFilas(this.tabla1().body, this.busqueda()));

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
    this.servicio.obtenerCanalAlterno({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.mensajes.warn('Este asesor no tiene canales alternativos registrados.', 'Sin resultados');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

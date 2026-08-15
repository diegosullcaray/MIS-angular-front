import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { PlanDatosService } from '../../../services/plan-datos.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import { fechaBasePorDefecto, generarOpcionesFechaBase } from '../../../models/analista/plan-datos.model';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Plan de Datos" — migrado de la ruta `leg/com/rda/sec/plan-datos-sec`
 * (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`,
 * config `P_Datos` en `crs-map.ts`).
 *
 * Solo lectura: asesor + filtro real "Fecha Base" (mes cerrado más reciente
 * por defecto, `generarOpcionesFechaBase()`) → 1 tabla. Cambiar la fecha
 * recarga la tabla si ya hay un asesor elegido.
 */
@Component({
  selector: 'app-plan-datos',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, SkeletonModule, TablaReporteComponent],
  templateUrl: './plan-datos.component.html',
  styleUrl: './plan-datos.component.css',
})
export class PlanDatosComponent {
  private readonly servicio = inject(PlanDatosService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly opcionesFechaBase = generarOpcionesFechaBase();

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);
  protected readonly fechaBase = signal(fechaBasePorDefecto());

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
    if (asesor) this.cargarPlanDatos();
  }

  protected onFechaBaseSeleccionada(fechaBase: string): void {
    this.fechaBase.set(fechaBase);
    if (this.asesorSeleccionado()) this.cargarPlanDatos();
  }

  private cargarPlanDatos(): void {
    const asesor = this.asesorSeleccionado();
    if (!asesor) return;

    this.cargando.set(true);
    this.servicio.obtenerPlanDatos({ tip_cod: 2, cod_rel: asesor.dni }, this.fechaBase()).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.mensajes.warn('Este asesor no tiene plan de datos para el período elegido.', 'Sin resultados');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

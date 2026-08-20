import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { PlanillaMovilidadService } from '../../services/planilla-movilidad.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { fechaUltimoDia } from '../../../../utils/fecha-reporte.util';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** Criterios de depuración de puntos geolocalizados — mismo texto en las pestañas "Válidos" y "Depurados" del legado. */
const CRITERIOS_MOVILIDAD: string[] = [
  '(1) Coordenadas distintas por día (se aceptan hasta 4 decimales iguales)',
  '(2) Puntos geolocalizados en distintos a domingos y feriados',
  '(3) Puntos geolocalizados en días distintos de vacaciones ó licencias',
  '(4) Conversión de puntos a desplazamientos',
  '(5) Puntos dentro de la zona de influencia del asesor',
  '(6) Desplazamientos diarios no totalizan como mínimo 400mts',
];

/**
 * "Planilla de Movilidad" — migrado de la ruta `leg/com/rda/sec/plan-mov-sec`
 * (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v5`,
 * config `PLANMOV` en `crs-map.ts`).
 *
 * Solo lectura: asesor → 4 tablas, el período (`fec`) es fijo ("ayer",
 * `fechaUltimoDia()`), sin selector — igual que el legado (`fec_day_ult`
 * hardcodeado en `crs-map.ts`, no un filtro elegible).
 *
 * Los 4 bloques forman en el legado una única grilla de pestañas — "Cascada",
 * "Válidos" y "Depurados" (confirmado por captura del legado). La pestaña
 * "Cascada" apila `_01` ("Planilla de Gastos por Movilidad - Asesores") y
 * `_02` ("Cascada de filtros aplicados"); "Válidos" (`_03`) y "Depurados"
 * (`_04`) van solas en su propia pestaña.
 */
@Component({
  selector: 'app-planilla-movilidad',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TabsModule, TablaReporteComponent, TooltipModule, WindowPanelComponent],
  templateUrl: './planilla-movilidad.component.html',
  styleUrl: './planilla-movilidad.component.css',
})
export class PlanillaMovilidadComponent {
  private readonly servicio = inject(PlanillaMovilidadService);
  private readonly toast = inject(ToastService);

  protected readonly periodo = this.formatearPeriodo(fechaUltimoDia());
  protected readonly tabCascada = signal('cascada');
  protected readonly criteriosMovilidad = CRITERIOS_MOVILIDAD;

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);

  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla4 = signal<TablaReporteResultado>(TABLA_VACIA);

  constructor() {
    this.cargarAsesores();
  }

  private formatearPeriodo(fechaYYYYMMDD: string): string {
    return `${fechaYYYYMMDD.slice(6, 8)}/${fechaYYYYMMDD.slice(4, 6)}/${fechaYYYYMMDD.slice(0, 4)}`;
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
    this.servicio.obtenerPlanillaMovilidad({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ tabla1, tabla2, tabla3, tabla4 }) => {
        this.tabla1.set(tabla1);
        this.tabla2.set(tabla2);
        this.tabla3.set(tabla3);
        this.tabla4.set(tabla4);
        this.cargando.set(false);

        if ([tabla1, tabla2, tabla3, tabla4].every((t) => t.body.length === 0)) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene planilla de movilidad para el período, o los datos podrían seguir procesándose.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

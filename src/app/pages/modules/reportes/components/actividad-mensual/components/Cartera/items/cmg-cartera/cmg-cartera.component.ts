import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnobModule } from 'primeng/knob';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import {
  CMG_CARTERA_VACIO,
  FASE_CMG_CARTERA_POR_DEFECTO,
  OPCIONES_FASE_CMG_CARTERA,
  type CmgCarteraResultado,
  type TarjetaCmgCartera,
} from '../../../../../actividad-diaria/components/Cartera/models/cmg-cartera.model';
import type { OpcionFiltro } from '../../../../../../models/filtros.model';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';

/** "CMG Cartera" (`repositorio/actividad-mensual/cartera/cmg-cartera-m`). */
@Component({
  selector: 'app-mensual-cmg-cartera',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    KnobModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './cmg-cartera.component.html',
  styleUrl: './cmg-cartera.component.css',
})
export class CmgCarteraComponent {
  private readonly servicio = inject(ActividadMensualRepoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFase = OPCIONES_FASE_CMG_CARTERA;
  protected readonly fase = signal<number>(FASE_CMG_CARTERA_POR_DEFECTO);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly reporte = signal<CmgCarteraResultado>(CMG_CARTERA_VACIO);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tarjetas = computed(() => this.reporte().tarjetas);
  protected readonly tabla = computed(() => this.reporte().tabla);

  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  private readonly progresoAnillos = signal<Record<string, number>>({});

  constructor() {
    this.servicio.periodos('RS_FECH').subscribe((opciones) => {
      this.periodos.set(opciones);
      if (opciones.length > 0) this.periodo.set(String(opciones[0].id));
    });

    effect(() => {
      const nodo = this.nivelActual();
      const fase = this.fase();
      const periodo = this.periodo();
      if (nodo) this.cargar(nodo, fase, periodo);
    });
  }

  protected isNumeroFinito(valor: number | string): boolean {
    return valor !== '' && Number.isFinite(Number(valor));
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }

  protected valorAnillo(tarjeta: TarjetaCmgCartera): number {
    return this.progresoAnillos()[tarjeta.etiqueta] ?? 0;
  }

  protected colorAnillo(valor: number): string {
    if (valor <= 0) return 'transparent';
    if (valor < 95) return 'var(--mis-danger)';
    if (valor <= 100) return 'var(--mis-warning)';
    return 'var(--mis-success)';
  }

  private cargar(nodo: HierarquiaNodo, fase: number, periodo: string): void {
    this.cargando.set(true);
    this.servicio.cmgCartera({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fase, periodo || undefined).subscribe({
      next: (reporte) => {
        this.reporte.set(reporte);
        this.cargando.set(false);
        this.animarAnillos(reporte.tarjetas);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  private animarAnillos(tarjetas: TarjetaCmgCartera[]): void {
    this.progresoAnillos.set({});
    const duracionMs = 900;
    for (const t of tarjetas) {
      if (t.cumplimiento === undefined) continue;
      const objetivo = t.cumplimiento;
      const etiqueta = t.etiqueta;
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const progreso = Math.min((ahora - inicio) / duracionMs, 1);
        this.progresoAnillos.update((m) => ({ ...m, [etiqueta]: Math.round(objetivo * progreso * 10) / 10 }));
        if (progreso < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }
  }
}

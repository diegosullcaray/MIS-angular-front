import { Component, inject, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import {
  MOVIMIENTO_CLIENTES_VACIO,
  PESTANAS_MOVIMIENTO_CLIENTES,
  type MovimientoClientesResultado,
} from '../../models/movimiento-clientes.model';
import { MovimientoClientesService } from '../../services/movimiento-clientes.service';

/** "Movimiento de Clientes" (`repositorio/actividad-diaria/clientes/movimiento-clientes`). */
@Component({
  selector: 'app-movimiento-clientes',
  standalone: true,
  imports: [TablaDinamicaComponent, WindowPanelComponent, TabsModule],
  templateUrl: './movimiento-clientes.component.html',
})
export class MovimientoClientesComponent {
  private readonly servicio = inject(MovimientoClientesService);
  private readonly toast = inject(ToastService);

  protected readonly pestanas = PESTANAS_MOVIMIENTO_CLIENTES;
  protected readonly cargando = signal(true);
  protected readonly reporte = signal<MovimientoClientesResultado>(MOVIMIENTO_CLIENTES_VACIO);

  /** Bloque activo por pestaña (chips dentro del tab, como en el selector de nivel). */
  private readonly bloqueActivo = signal<Record<string, number>>({});

  constructor() {
    // Sin jerarquía que elegir, el reporte se pide de una — igual que el legado.
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.servicio.obtener().subscribe({
      next: (reporte) => {
        this.reporte.set(reporte);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected filas(gru: number): Record<string, unknown>[] {
    return this.reporte().grupos[gru] ?? [];
  }

  /** Bloque elegido de esa pestaña; por defecto, el primero. */
  protected bloqueSeleccionado(pestanaId: string, bloques: readonly { gru: number }[]): number {
    return this.bloqueActivo()[pestanaId] ?? bloques[0].gru;
  }

  protected seleccionarBloque(pestanaId: string, gru: number): void {
    this.bloqueActivo.update((actual) => ({ ...actual, [pestanaId]: gru }));
  }
}

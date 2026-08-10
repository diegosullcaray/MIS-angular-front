import { Component, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { ResultadoBancarizacion } from '../../models';

/**
 * Diálogo de detalle de Bancarización — migrado de `Detalle2Component`/
 * `Detalle2DialogComponent`/`Detalle2BaseComponent` (legado STG,
 * `pages/modules/incentivos3/detalle2`), único consumidor real de
 * `comp:2` en el legado (`super-plus.util.ts`, ítem `clib`). Sin
 * drill-down — es una tabla plana con totales.
 */
@Component({
  selector: 'app-detalle-bancarizacion-dialog',
  standalone: true,
  imports: [DialogModule, TableModule, SkeletonModule, DecimalPipe],
  templateUrl: './detalle-bancarizacion-dialog.component.html',
  styleUrl: './detalle-bancarizacion-dialog.component.css',
})
export class DetalleBancarizacionDialogComponent {
  private readonly incentivos = inject(IncentivosService);
  private readonly toast = inject(ToastService);

  readonly visible = input(false);
  readonly visibleChange = output<boolean>();

  protected readonly cargando = signal(false);
  protected readonly resultado = signal<ResultadoBancarizacion>({ filas: [], totales: null });

  constructor() {
    effect(() => {
      if (this.visible()) this.cargar();
    });
  }

  private cargar(): void {
    const nivel = this.incentivos.nivelActual();
    if (!nivel) return;

    this.cargando.set(true);
    this.incentivos.obtenerBancarizacion(nivel.tipCod, nivel.codRel).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el detalle de bancarización', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected claseFila(tf: number): string {
    if (tf === 1) return 'bg-[var(--mis-primary-light)]';
    if (tf === 2) return 'bg-[var(--mis-warning-light)]';
    return '';
  }

  protected claseIndicador(valor: number): string {
    return valor === 1 ? 'text-[var(--mis-success)]' : 'text-[var(--mis-text-tertiary)]';
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }
}

import { computed, inject, signal } from '@angular/core';
import { AsesorSecService } from '../services/asesor-sec.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import type { AsesorSec } from '../models/asesor-sec.model';

/**
 * Estado del selector de asesor, común a todos los reportes de `rda/sectorista`.
 *
 * La lista se pide una sola vez al construir: es la misma para todos y no
 * depende de la pantalla.
 */
export abstract class SelectorAsesorBase {
  protected readonly toast = inject(ToastService);
  private readonly asesorSec = inject(AsesorSecService);
  private readonly shell = inject(ShellStateService);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);
  /** Asesor autenticado cuando STG lo identifica como `tip_use = 1`. */
  protected readonly asesorPropio = signal<AsesorSec | null>(null);
  protected readonly mostrarSelector = computed(() => this.asesorPropio() === null);
  protected readonly cargando = signal(false);

  constructor() {
    const usuario = this.shell.usuarioActivo();
    if (usuario?.tipoUsuario === 1 && usuario.numDoc) {
      const asesor = { nombre: usuario.nombre, dni: usuario.numDoc };
      this.asesorPropio.set(asesor);
      this.asesorSeleccionado.set(asesor);
      return;
    }

    this.asesorSec.obtenerAsesores().subscribe({
      next: (asesores) => this.asesores.set(asesores),
      error: () =>
        this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.'),
    });
  }

  /** El nodo con el que se consulta un reporte de asesor: siempre `tip_cod: 2` + su DNI. */
  protected nodoDe(asesor: AsesorSec): { tip_cod: number; cod_rel: string } {
    return { tip_cod: 2, cod_rel: asesor.dni };
  }
}

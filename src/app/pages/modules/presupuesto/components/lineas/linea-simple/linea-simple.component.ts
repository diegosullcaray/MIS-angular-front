import { Component, computed, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { HierSelectorComponent } from '../../../../../../shared/ui/hier-selector/hier-selector.component';
import { EditableTableComponent } from '../../../../../../shared/ui/tablas/editable-table/editable-table.component';
import { WindowPanelComponent } from '../../../../../../shared/ui/window-panel/window-panel.component';
import { calcularPuedeGuardar, calcularPuedeVerificar, esCeldaEditable } from '../../../utils/linea-simple-reglas.util';
import type { CeldaEditadaEvent } from '../../../../../../shared/ui/tablas/models/tabla-editable.model';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { FilaLineaSimple, LineaSimpleConfig, ResumenMetadata } from '../../../models/linea-simple.model';

/** Pantalla genérica "línea simple" — reemplaza a `PreLineaSimpleComponent` (clase base abstracta del legado), usada tal cual por Depósitos BP/Red y Seguros Comercial/Operaciones (cada una solo aporta su propia `LineaSimpleConfig`, ver los 4 componentes delgados en `components/`). */
@Component({
  selector: 'app-linea-simple',
  standalone: true,
  imports: [HierSelectorComponent, EditableTableComponent, ButtonModule, WindowPanelComponent],
  templateUrl: './linea-simple.component.html',
})
export class LineaSimpleComponent<F extends FilaLineaSimple = FilaLineaSimple> {
  private readonly presupuesto = inject(PresupuestoService);
  private readonly toast = inject(ToastService);

  readonly config = input.required<LineaSimpleConfig<F>>();

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly verificando = signal(false);
  protected readonly filas = signal<F[]>([]);
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  private readonly metadata = signal<ResumenMetadata | null>(null);
  private filasOriginales: F[] = [];

  protected readonly puedeGuardar = computed(() =>
    calcularPuedeGuardar(this.metadata(), this.nivelActual(), this.presupuesto.esAdmin())
  );

  protected readonly puedeVerificar = computed(() =>
    calcularPuedeVerificar(this.metadata(), this.nivelActual(), this.presupuesto.esAdmin())
  );

  protected readonly esEditable = (fila: F, key: string): boolean =>
    esCeldaEditable(fila, key, this.config().inputCols, this.metadata(), this.nivelActual(), this.presupuesto.esAdmin());

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);
    this.metadata.set(null);
    this.filas.set([]);

    this.config()
      .obtenerResumen(nodo.tip_cod, nodo.cod_rel)
      .subscribe({
        next: (resumen) => {
          this.metadata.set(resumen.bp);
          const ws = resumen.ws ?? [];
          this.filas.set(ws);
          this.filasOriginales = structuredClone(ws);
          this.cargando.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar la información', 'Inténtalo de nuevo en unos segundos.');
          this.cargando.set(false);
        },
      });
  }

  /** Botón "Actualizar" de la ventana: relee el nivel que está en pantalla. */
  protected recargar(): void {
    const nivel = this.nivelActual();
    if (nivel) this.onNivelSeleccionado(nivel);
  }

  protected onCeldaEditada(evento: CeldaEditadaEvent<F>): void {
    const filas = this.filas();
    const idx = filas.indexOf(evento.fila);
    if (idx === -1) return;

    const calcular = this.config().calcularFila;
    if (calcular) {
      for (let i = idx; i < filas.length; i++) {
        calcular(filas, i);
      }
    }
    this.filas.set([...filas]);
  }

  protected reiniciar(): void {
    this.filas.set(structuredClone(this.filasOriginales));
  }

  protected guardar(): void {
    const meta = this.metadata();
    const nivel = this.nivelActual();
    if (!meta || !nivel) return;

    const filasAEnviar = this.filas().filter((f) => f.ord >= meta.ord_ini_edi);
    this.guardando.set(true);
    this.config()
      .guardarResumen(nivel.tip_cod, nivel.cod_rel, filasAEnviar)
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.toast.exito('Guardado', 'Los cambios se guardaron correctamente.');
        },
        error: () => {
          this.guardando.set(false);
          this.toast.error('No se pudo guardar', 'Inténtalo de nuevo en unos segundos.');
        },
      });
  }

  protected verificar(): void {
    const meta = this.metadata();
    const nivel = this.nivelActual();
    if (!meta || !nivel) return;

    this.verificando.set(true);
    this.presupuesto.verificar(nivel.tip_cod, nivel.cod_rel, meta.cod_sec).subscribe({
      next: () => {
        this.verificando.set(false);
        this.toast.exito('Verificado', 'El nivel quedó marcado como verificado.');
      },
      error: () => {
        this.verificando.set(false);
        this.toast.error('No se pudo verificar', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }
}

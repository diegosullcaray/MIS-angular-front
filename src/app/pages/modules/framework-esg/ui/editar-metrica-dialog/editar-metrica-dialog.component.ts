import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FrameworkEsgService } from '../../services/framework-esg.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { EsgAtributoConfig, EsgMetricaFila, EsgSituacionOpcion } from '../../models';

/**
 * Diálogo de Editar/Detalle de una métrica ESG — reemplaza a
 * `EditarComponent`/`EditarDialogComponent` (legado STG, ambos extendían
 * `EditarBaseComponent`; acá se resuelve como un único componente con
 * `p-dialog`, sin la variante enrutada para mobile del legado — el layout
 * de este Host ya es responsive, ver `ShellLayoutComponent`).
 *
 * En modo detalle (`modoEdicion=false`) los campos son de solo lectura y no
 * se muestra el botón "Guardar" — igual que `editForm.disable()` del legado.
 */
@Component({
  selector: 'app-editar-metrica-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, InputTextModule, SelectModule, FormsModule],
  templateUrl: './editar-metrica-dialog.component.html',
  styleUrl: './editar-metrica-dialog.component.css',
})
export class EditarMetricaDialogComponent {
  private readonly esg = inject(FrameworkEsgService);
  private readonly toast = inject(ToastService);

  readonly visible = input(false);
  readonly fila = input<EsgMetricaFila | null>(null);
  readonly modoEdicion = input(false);
  readonly situaciones = input<EsgSituacionOpcion[]>([]);
  readonly atributos = input<EsgAtributoConfig[]>([]);
  readonly columnasHistoricas = input<string[]>([]);

  readonly visibleChange = output<boolean>();
  /** Emitido tras un guardado exitoso — el padre debe recargar la categoría afectada. */
  readonly guardado = output<void>();

  protected readonly guardando = signal(false);

  protected readonly desDisponible = signal('');
  protected readonly situacion = signal<number | string | null>(null);
  protected readonly historico = signal<Record<string, unknown>>({});
  protected readonly atributosValores = signal<Record<string, unknown>>({});

  protected readonly titulo = computed(() => (this.modoEdicion() ? 'Editar Metrica ESG' : 'Detalle Metrica ESG'));

  constructor() {
    // Sincroniza el formulario cada vez que el padre selecciona una fila distinta.
    effect(() => {
      const fila = this.fila();
      if (!fila) return;

      this.desDisponible.set(fila.des_dis ?? '');
      this.situacion.set(fila.sit_met ?? null);

      const hist: Record<string, unknown> = {};
      this.columnasHistoricas().forEach((clave) => (hist[clave] = fila[clave]));
      this.historico.set(hist);

      let atributosCrudos: Record<string, unknown> = {};
      try {
        atributosCrudos = fila.cfg_met ? (JSON.parse(fila.cfg_met) as Record<string, unknown>) : {};
      } catch {
        atributosCrudos = {};
      }
      const valores: Record<string, unknown> = {};
      this.atributos().forEach((atributo) => (valores[atributo.key] = atributosCrudos[atributo.key]));
      this.atributosValores.set(valores);
    });
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }

  protected actualizarHistorico(clave: string, valor: unknown): void {
    this.historico.update((actual) => ({ ...actual, [clave]: valor }));
  }

  protected actualizarAtributo(clave: string, valor: unknown): void {
    this.atributosValores.update((actual) => ({ ...actual, [clave]: valor }));
  }

  protected guardar(): void {
    const fila = this.fila();
    if (!fila) return;

    this.guardando.set(true);
    const payload = {
      des_dis: this.desDisponible(),
      sit_met: this.situacion() ?? fila.sit_met,
      hist: this.historico(),
      cfg_met: this.atributosValores(),
    };

    this.esg.actualizarMetrica(fila.cod_met, payload).subscribe({
      next: (ok) => {
        this.guardando.set(false);
        if (ok) {
          this.toast.exito('Guardado', 'La métrica se actualizó correctamente.');
          this.guardado.emit();
          this.cerrar();
        } else {
          this.toast.error('No se pudo guardar', 'Inténtalo de nuevo en unos segundos.');
        }
      },
      error: () => {
        this.guardando.set(false);
        this.toast.error('No se pudo guardar', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }
}

import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { redondear } from '../../utils/incentivos-calculo.util';
import type { PlusCalculadora, VariableCalculadora } from '../../models';

/** Opciones fijas del selector "Sistemática" — `<select>` hardcodeado del legado (`calculadora.component.html`). */
const OPCIONES_SISTEMATICA = [
  { label: 'No Aplica', value: 2 },
  { label: 'Si Cumple', value: 1 },
  { label: 'No Cumple', value: 0 },
];

/**
 * Calculadora de simulación — migrado de `CalculadoraComponent`/
 * `CalculadoraDialogComponent`/`CalculadoraBaseComponent` (legado STG,
 * `pages/modules/incentivos3/calculadora`). Sin la variante enrutada para
 * mobile del legado (`showCalculator()` navegaba a `./calculadora` en
 * mobile) — el layout de este Host ya es responsive.
 *
 * A diferencia del legado (un `FormGroup` con un `FormControl` por
 * variable), acá los valores editados viven en un único `signal` plano
 * (`valoresEditados`, clave = clave del payload de simulación) y las
 * tarjetas leen bonos/metas directo de `IncentivosService.calculadora()` —
 * así el resultado de `simular()` (que muta esa señal) se refleja solo,
 * sin tener que sincronizar dos copias del estado.
 */
@Component({
  selector: 'app-calculadora-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, InputNumberModule, SelectModule, FormsModule, DecimalPipe],
  templateUrl: './calculadora-dialog.component.html',
  styleUrl: './calculadora-dialog.component.css',
})
export class CalculadoraDialogComponent {
  protected readonly incentivos = inject(IncentivosService);
  private readonly toast = inject(ToastService);

  readonly visible = input(false);
  readonly visibleChange = output<boolean>();

  protected readonly opcionesSistematica = OPCIONES_SISTEMATICA;
  protected readonly simulando = signal(false);
  protected readonly errorComposicion = signal(false);
  protected readonly valoresEditados = signal<Record<string, number>>({});

  protected readonly variablesVisibles = computed(() => this.incentivos.calculadora().variables.filter((v) => v.show));
  protected readonly plusVisibles = computed(() => this.incentivos.calculadora().plus.filter((p) => p.show));
  protected readonly efec1 = computed(() => this.variablesVisibles().find((v) => v.id === 'efec1'));
  protected readonly tas = computed(() => this.plusVisibles().find((p) => p.id === 'tas'));

  protected readonly diffTasaPbs = computed(() => {
    const t = this.valor('p_tas');
    const t1 = this.valor('p_tas2');
    return redondear((t - t1) * 10000, 0);
  });

  protected readonly comisionTexto = computed(() => (this.incentivos.calculadora().activo === 0 ? '(No Comisiona)' : '(Comisiona)'));
  protected readonly comisionClase = computed(() =>
    this.incentivos.calculadora().activo === 0 ? 'text-[var(--mis-danger)]' : 'text-[var(--mis-success)]'
  );

  constructor() {
    effect(() => {
      if (this.visible()) this.reiniciarValores();
    });
  }

  protected valor(clave: string): number {
    return this.valoresEditados()[clave] ?? 0;
  }

  protected actualizar(clave: string, valor: number | null): void {
    this.valoresEditados.update((actual) => ({ ...actual, [clave]: valor ?? 0 }));
  }

  /** Valor mostrado en el input — los campos `percent` se muestran ×100 (ej. 0.85 → 85), igual que `stg-pinput` del legado. */
  protected valorMostrado(clave: string, formato: 'number' | 'percent'): number {
    const v = this.valor(clave);
    return formato === 'percent' ? redondear(v * 100, 2) : v;
  }

  protected actualizarDesdeInput(clave: string, formato: 'number' | 'percent', valorMostrado: number | null): void {
    const v = valorMostrado ?? 0;
    this.actualizar(clave, formato === 'percent' ? v / 100 : v);
  }

  protected reiniciarValores(): void {
    const calc = this.incentivos.calculadora();
    const valores: Record<string, number> = {};

    calc.variables
      .filter((v) => v.show)
      .forEach((v) => {
        valores[v.key] = v.val;
        if (v.id === 'efec1') {
          valores['tp1'] = v.tp1 ?? 0;
          valores['tp2'] = v.tp2 ?? 0;
          valores['tp3'] = v.tp3 ?? 0;
        }
      });

    calc.plus
      .filter((p) => p.show)
      .forEach((p) => {
        valores[p.key] = p.val;
        if (p.id === 'tas') valores['p_tas2'] = p.val1 ?? 0;
      });

    this.valoresEditados.set(valores);
    this.errorComposicion.set(false);
  }

  protected simular(): void {
    const efec1Item = this.efec1();
    if (efec1Item) {
      const suma = redondear((this.valor('tp1') + this.valor('tp2') + this.valor('tp3')) * 100, 0);
      if (suma !== 100) {
        this.errorComposicion.set(true);
        return;
      }
    }
    this.errorComposicion.set(false);

    this.simulando.set(true);
    this.incentivos.simular(this.valoresEditados()).subscribe({
      next: (ok) => {
        this.simulando.set(false);
        if (ok) {
          this.toast.exito('Simulación lista', 'Los bonos se recalcularon con los valores ingresados.');
        } else {
          this.toast.error('No se pudo simular', 'Inténtalo de nuevo en unos segundos.');
        }
      },
      error: () => {
        this.simulando.set(false);
        this.toast.error('No se pudo simular', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }

  protected etiquetaValor(item: VariableCalculadora | PlusCalculadora): string {
    switch (item.id) {
      case 'clib':
        return 'Clientes Banc.:';
      case 'tas':
        return 'Tasa Mes:';
      default:
        return 'Valor:';
    }
  }

  protected etiquetaMeta(item: PlusCalculadora): string {
    switch (item.id) {
      case 'prod':
        return 'Meta:';
      case 'tas':
        return 'Tasa Min:';
      default:
        return '';
    }
  }

  protected formatear(valor: number | undefined, formato: 'number' | 'percent'): string {
    const v = valor ?? 0;
    return formato === 'percent' ? `${(v * 100).toFixed(2)}%` : v.toFixed(2);
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }
}

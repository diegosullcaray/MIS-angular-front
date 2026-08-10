import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { ETIQUETAS_DETALLE_SUPER_PLUS, ETIQUETAS_DETALLE_VARIABLE } from '../../utils/incentivos-config.util';
import type { FilaRankingDetalle, FilaVariableDetalle, ResultadoDetalleVariable } from '../../models';

type Vista = 'vars' | 'rank';
type ReqDetalle = 'getDetail' | 'getTasa' | 'getProd' | 'getRetencion';

/** Una "pantalla" del drill-down — cada clic en Ranking pide datos nuevos; cada clic en un bloque de Indicadores solo cambia `bloqueActivo` sobre el mismo `resultado`. */
interface FrameDetalle {
  tipCod: number;
  codRel: string;
  desRel: string;
  desLab: string;
  resultado: ResultadoDetalleVariable;
  bloqueActivo: number;
}

/**
 * Diálogo de detalle de variable (drill-down) — migrado de
 * `DetalleComponent`/`DetalleDialogComponent`/`DetalleBaseComponent`
 * (legado STG, `pages/modules/incentivos3/detalle`). Reemplaza el historial
 * `buffer`/`pointer` con navegación adelante/atrás del legado por una pila
 * (`pila`, solo "atrás") — simplificación consciente: rehacer ("adelante")
 * tras retroceder no se migra, es una conveniencia menor que agrega
 * complejidad de estado por poco valor real.
 */
@Component({
  selector: 'app-detalle-variable-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, TableModule, SkeletonModule, DecimalPipe],
  templateUrl: './detalle-variable-dialog.component.html',
  styleUrl: './detalle-variable-dialog.component.css',
})
export class DetalleVariableDialogComponent {
  private readonly incentivos = inject(IncentivosService);
  private readonly toast = inject(ToastService);

  readonly visible = input(false);
  readonly titulo = input('');
  readonly icono = input('pi pi-info-circle');
  readonly req = input<ReqDetalle>('getDetail');
  readonly codVar = input(0);
  readonly mostrarTarjetas = input(false);

  readonly visibleChange = output<boolean>();

  protected readonly cargando = signal(false);
  protected readonly pila = signal<FrameDetalle[]>([]);
  protected readonly vistaTabla = signal<Vista>('vars');

  protected readonly frameActual = computed<FrameDetalle | null>(() => {
    const p = this.pila();
    return p.length ? p[p.length - 1] : null;
  });

  protected readonly varsMostradas = computed<FilaVariableDetalle[]>(() => {
    const f = this.frameActual();
    return f ? f.resultado.vars.filter((v) => v.cod_block === f.bloqueActivo) : [];
  });

  protected readonly puedeVolver = computed(() => this.pila().length > 1);
  protected readonly muestraBotonesToggle = computed(() => (this.frameActual()?.tipCod ?? 1) !== 1);

  protected readonly etiquetas = computed(() => {
    const slot = this.codVar() === 91 ? 1 : this.codVar();
    const mapa = this.req() === 'getProd' ? ETIQUETAS_DETALLE_SUPER_PLUS : ETIQUETAS_DETALLE_VARIABLE;
    return mapa[slot];
  });

  constructor() {
    effect(() => {
      if (this.visible()) this.abrirRaiz();
    });
  }

  private abrirRaiz(): void {
    const perfil = this.incentivos.perfil();
    const nivel = this.incentivos.nivelActual();
    if (!nivel) return;

    this.pila.set([]);
    this.vistaTabla.set('vars');
    this.cargarFrame(nivel.tipCod, nivel.codRel, perfil?.nombre ?? '--', this.etiquetaNivel(nivel.tipCod));
  }

  private etiquetaNivel(tipCod: number): string {
    if (tipCod === 1) return 'Asesor';
    if (tipCod === 18) return 'Unidad';
    if (tipCod === 19) return 'Corredor';
    if (tipCod === 20) return 'Territorio';
    return 'Total';
  }

  private cargarFrame(tipCod: number, codRel: string, desRel: string, desLab: string): void {
    this.cargando.set(true);
    this.incentivos.obtenerDetalleVariable(this.req(), tipCod, codRel, this.codVar()).subscribe({
      next: (resultado) => {
        this.cargando.set(false);
        if (!resultado) {
          this.toast.error('No se pudo cargar el detalle', 'Inténtalo de nuevo en unos segundos.');
          return;
        }
        this.pila.update((p) => [...p, { tipCod, codRel, desRel, desLab, resultado, bloqueActivo: 1 }]);
        this.vistaTabla.set('vars');
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo cargar el detalle', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }

  protected drillBloque(fila: FilaVariableDetalle): void {
    if (fila.cod_bdd === undefined || fila.cod_bdd === null) return;
    const actual = this.frameActual();
    if (!actual) return;
    this.pila.update((p) => [...p, { ...actual, bloqueActivo: fila.cod_bdd as number }]);
    this.vistaTabla.set('vars');
  }

  protected drillRanking(fila: FilaRankingDetalle): void {
    this.cargarFrame(fila.tip_cod, fila.cod_rel, fila.des_rel, this.etiquetaNivel(fila.tip_cod));
  }

  protected volver(): void {
    if (!this.puedeVolver()) return;
    this.pila.update((p) => p.slice(0, -1));
    this.vistaTabla.set('vars');
  }

  protected mostrarVars(): void {
    this.vistaTabla.set('vars');
  }

  protected mostrarRank(): void {
    this.vistaTabla.set('rank');
  }

  private formatoTarjeta(): 'currency' | 'integer' | 'percent' | 'decimal' {
    if (this.req() === 'getProd') return 'decimal';
    const slot = this.codVar() === 91 ? 1 : this.codVar();
    if (slot === 1) return 'currency';
    if (slot === 2) return 'integer';
    return 'percent';
  }

  protected formatearValorTarjeta(valor: number | undefined): string {
    const v = valor ?? 0;
    const formato = this.formatoTarjeta();
    if (formato === 'currency') return `S/. ${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (formato === 'integer') return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (formato === 'percent') return `${(v * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
    return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  protected formatearMeta(): string {
    const card = this.frameActual()?.resultado.card;
    if (!card || card.exis_met === 0) return '--';
    return this.formatearValorTarjeta(card.met);
  }

  protected formatearCelda(valor: number | undefined, formato: string | undefined): string {
    if (valor === undefined || valor === null) return '--';
    if (formato === 'percent') return `${(valor * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
    if (formato === 'pen') return `S/. ${valor.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    return valor.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }
}

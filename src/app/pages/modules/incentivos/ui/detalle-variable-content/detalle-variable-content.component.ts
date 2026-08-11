import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { ETIQUETAS_DETALLE_SUPER_PLUS, ETIQUETAS_DETALLE_VARIABLE } from '../../utils/incentivos-config.util';
import type { FilaRankingDetalle, FilaVariableDetalle, ResultadoDetalleVariable } from '../../models';

type Vista = 'vars' | 'rank';
type ReqDetalle = 'getDetail' | 'getTasa' | 'getProd' | 'getRetencion';

/** Una "pantalla" del drill-down — cada clic en Ranking pide datos nuevos a un `resultado` distinto y se apila. */
interface FrameDetalle {
  tipCod: number;
  codRel: string;
  desRel: string;
  desLab: string;
  resultado: ResultadoDetalleVariable;
}

/**
 * Contenido del drill-down de detalle de variable — extraído de
 * `DetalleVariableDialogComponent` para poder mostrarse tanto en el diálogo
 * (popup) como embebido inline (fila expandida de `TablaVariablesComponent`).
 * Reemplaza el historial `buffer`/`pointer` del legado por una pila (`pila`,
 * solo "atrás") — simplificación consciente: rehacer ("adelante") tras
 * retroceder no se migra.
 *
 * Los bloques de "Indicadores" (`cod_bdd`) ya no reemplazan la tabla entera
 * al hacer clic (como hacía `bloqueActivo` antes): se expanden en línea,
 * como fila anidada, con el mismo criterio visual que usa
 * `TablaVariablesComponent` para expandir esta misma vista.
 */
@Component({
  selector: 'app-detalle-variable-content',
  standalone: true,
  imports: [ButtonModule, TableModule, SkeletonModule, DecimalPipe],
  templateUrl: './detalle-variable-content.component.html',
  styleUrl: './detalle-variable-content.component.css',
})
export class DetalleVariableContentComponent {
  private readonly incentivos = inject(IncentivosService);
  private readonly toast = inject(ToastService);

  /** `true` mientras el contenido está visible (diálogo abierto, o fila expandida) — dispara la carga inicial. */
  readonly activo = input(false);
  readonly req = input<ReqDetalle>('getDetail');
  readonly codVar = input(0);
  readonly mostrarTarjetas = input(false);

  protected readonly cargando = signal(false);
  protected readonly pila = signal<FrameDetalle[]>([]);
  protected readonly vistaTabla = signal<Vista>('vars');
  /** `cod_bdd` de la fila de Indicadores actualmente expandida en línea — `null` si ninguna. */
  protected readonly bloqueExpandido = signal<number | null>(null);

  protected readonly frameActual = computed<FrameDetalle | null>(() => {
    const p = this.pila();
    return p.length ? p[p.length - 1] : null;
  });

  /** Indicadores del bloque raíz (`cod_block===1`) — los sub-bloques (`cod_bdd`) se expanden en línea, no reemplazan esta lista. */
  protected readonly varsMostradas = computed<FilaVariableDetalle[]>(() => {
    const f = this.frameActual();
    return f ? f.resultado.vars.filter((v) => v.cod_block === 1) : [];
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
      if (this.activo()) this.abrirRaiz();
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
        this.pila.update((p) => [...p, { tipCod, codRel, desRel, desLab, resultado }]);
        this.vistaTabla.set('vars');
        this.bloqueExpandido.set(null);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudo cargar el detalle', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }

  /** Sub-indicadores del bloque `codBdd` — fila anidada bajo la fila raíz que lo abrió. */
  protected subVars(codBdd: number): FilaVariableDetalle[] {
    return this.frameActual()?.resultado.vars.filter((v) => v.cod_block === codBdd) ?? [];
  }

  protected toggleBloque(fila: FilaVariableDetalle): void {
    if (fila.cod_bdd === undefined || fila.cod_bdd === null) return;
    this.bloqueExpandido.update((actual) => (actual === fila.cod_bdd ? null : (fila.cod_bdd as number)));
  }

  protected drillRanking(fila: FilaRankingDetalle): void {
    this.cargarFrame(fila.tip_cod, fila.cod_rel, fila.des_rel, this.etiquetaNivel(fila.tip_cod));
  }

  protected volver(): void {
    if (!this.puedeVolver()) return;
    this.pila.update((p) => p.slice(0, -1));
    this.vistaTabla.set('vars');
    this.bloqueExpandido.set(null);
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
}

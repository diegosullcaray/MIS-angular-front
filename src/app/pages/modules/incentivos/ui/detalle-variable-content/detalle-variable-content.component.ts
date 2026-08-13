import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import { ETIQUETAS_DETALLE_SUPER_PLUS, ETIQUETAS_DETALLE_VARIABLE } from '../../utils/incentivos-config.util';
import type { FilaRankingDetalle, FilaVariableDetalle, FrameDetalle, ReqDetalleVariable, ResultadoDetalleVariable } from '../../models/incentivos-detalle.model';

/** Contenido interactivo del drill-down de detalle de variable. */
@Component({
  selector: 'app-detalle-variable-content',
  standalone: true,
  imports: [TableModule, ButtonModule, SkeletonModule, DecimalPipe],
  templateUrl: './detalle-variable-content.component.html',
  styleUrl: './detalle-variable-content.component.css',
})
export class DetalleVariableContentComponent {
  private readonly incentivos = inject(IncentivosService);

  readonly activo = input(false);
  readonly req = input<ReqDetalleVariable>('getDetail');
  readonly codVar = input(0);
  readonly mostrarTarjetas = input(false);
  readonly tituloInicial = input('');

  protected readonly cargando = signal(false);
  protected readonly errorPaso = signal<string | null>(null);
  protected readonly vistaTabla = signal<'vars' | 'rank'>('vars');
  protected readonly pila = signal<FrameDetalle[]>([]);
  protected readonly bloqueExpandido = signal<number | null>(null);

  protected readonly etiquetas = computed(() => {
    const cv = this.codVar();
    if (!cv) return null;
    return this.req() === 'getTasa' ? ETIQUETAS_DETALLE_SUPER_PLUS[cv] : ETIQUETAS_DETALLE_VARIABLE[cv];
  });

  protected readonly frameActual = computed<FrameDetalle | null>(() => {
    const p = this.pila();
    return p.length > 0 ? p[p.length - 1] : null;
  });

  protected readonly puedeVolver = computed(() => this.pila().length > 1);
  protected readonly muestraBotonesToggle = computed(() => (this.frameActual()?.resultado.rank.length ?? 0) > 0);
  protected readonly varsMostradas = computed(() => this.frameActual()?.resultado.vars.filter((v) => !v.cod_block) ?? []);

  constructor() {
    effect(() => {
      if (this.activo()) this.cargarInicial();
    });
  }

  private cargarInicial(): void {
    const nivel = this.incentivos.nivelActual();
    if (!nivel) return;

    this.cargando.set(true);
    this.errorPaso.set(null);
    this.pila.set([]);
    this.bloqueExpandido.set(null);
    this.vistaTabla.set('vars');

    this.incentivos.obtenerDetalleVariable(this.req(), nivel.tipCod, nivel.codRel, this.codVar()).subscribe({
      next: (resultado) => {
        if (resultado) {
          const perf = this.incentivos.perfil();
          this.pila.set([
            {
              tipCod: nivel.tipCod,
              codRel: nivel.codRel,
              desRel: perf?.nombre ?? '',
              desLab: perf?.descripcionNivel ?? 'Perfil',
              resultado,
            },
          ]);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.errorPaso.set('No se pudo cargar el detalle de la variable.');
        this.cargando.set(false);
      },
    });
  }

  protected volver(): void {
    if (!this.puedeVolver()) return;
    this.pila.update((p) => p.slice(0, -1));
    this.bloqueExpandido.set(null);
  }

  protected mostrarVars(): void {
    this.vistaTabla.set('vars');
  }

  protected mostrarRank(): void {
    this.vistaTabla.set('rank');
  }

  protected toggleBloque(fila: FilaVariableDetalle): void {
    if (fila.cod_bdd === undefined || fila.cod_bdd === null) return;
    const actual = this.bloqueExpandido();
    this.bloqueExpandido.set(actual === fila.cod_bdd ? null : fila.cod_bdd);
  }

  protected subVars(codBdd: number): FilaVariableDetalle[] {
    return this.frameActual()?.resultado.vars.filter((v) => v.cod_block === codBdd) ?? [];
  }

  protected drillRanking(fila: FilaRankingDetalle): void {
    this.cargando.set(true);
    this.incentivos.obtenerDetalleVariable(this.req(), fila.tip_cod, fila.cod_rel, this.codVar()).subscribe({
      next: (resultado) => {
        if (resultado) {
          this.pila.update((p) => [
            ...p,
            {
              tipCod: fila.tip_cod,
              codRel: fila.cod_rel,
              desRel: fila.des_rel,
              desLab: this.tituloInicial() || 'Nivel',
              resultado,
            },
          ]);
          this.bloqueExpandido.set(null);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  protected formatearValorTarjeta(val: number | undefined): string {
    if (val === undefined || val === null) return '--';
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  protected formatearMeta(): string {
    const card = this.frameActual()?.resultado.card;
    if (!card || card.exis_met === 0) return '--';
    return card.met.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  protected formatearCelda(val: number | undefined, fmt?: string): string {
    if (val === undefined || val === null) return '--';
    if (fmt === 'p') return `${(val * 100).toFixed(1)}%`;
    if (fmt === 'c') return Math.round(val).toLocaleString();
    return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
}

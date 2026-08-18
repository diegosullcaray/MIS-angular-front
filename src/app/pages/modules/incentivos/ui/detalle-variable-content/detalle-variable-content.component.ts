import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import {
  ETIQUETAS_DETALLE_SUPER_PLUS,
  ETIQUETAS_DETALLE_VARIABLE,
  normalizarCodVarDetalle,
} from '../../utils/incentivos-config.util';
import type { FilaRankingDetalle, FilaVariableDetalle, FrameDetalle, ReqDetalleVariable } from '../../models/incentivos-detalle.model';

/** Formato de una columna del ranking — mismos tipos que usaba `stg-table2` en el legado. */
type FormatoRanking = 'entero' | 'decimal' | 'porcentaje' | 'pbs';

/** Contenido interactivo del drill-down de detalle de variable. */
@Component({
  selector: 'app-detalle-variable-content',
  standalone: true,
  imports: [TableModule, ButtonModule, SkeletonModule],
  templateUrl: './detalle-variable-content.component.html',
  styleUrl: './detalle-variable-content.component.css',
})
export class DetalleVariableContentComponent {
  private readonly incentivos = inject(IncentivosService);
  private readonly toast = inject(ToastService);

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

  /** `typ` del legado: `getDetail` cubre las variables del Cuadro de Mando (`cv`); el resto son Super Plus (`sp`). */
  protected readonly tipoDetalle = computed<'cv' | 'sp'>(() => (this.req() === 'getDetail' ? 'cv' : 'sp'));

  /** `cod_var` normalizado para etiquetas y formatos — Cartera pide el detalle con 91 pero se configura como 1. */
  protected readonly codVarNormalizado = computed(() => normalizarCodVarDetalle(this.codVar()));

  protected readonly etiquetas = computed(() => {
    const cv = this.codVarNormalizado();
    if (!cv) return null;
    return this.tipoDetalle() === 'sp' ? ETIQUETAS_DETALLE_SUPER_PLUS[cv] : ETIQUETAS_DETALLE_VARIABLE[cv];
  });

  protected readonly frameActual = computed<FrameDetalle | null>(() => {
    const p = this.pila();
    return p.length > 0 ? p[p.length - 1] : null;
  });

  protected readonly puedeVolver = computed(() => this.pila().length > 1);
  /** Los botones Indicadores/Ranking solo aplican por encima del nivel individual — `showButtons()` del legado. */
  protected readonly muestraBotonesToggle = computed(() => (this.frameActual()?.tipCod ?? 1) !== 1);

  /**
   * Filas de primer nivel de la tabla de indicadores: las del bloque 1. Los
   * bloques 2..`card.blocks` son los sub-detalles que cuelgan de una fila con
   * `cod_bdd` (ver `subVars`). Antes se filtraba por `!cod_block`, que no
   * coincide con ninguna fila real y dejaba la tabla siempre vacía.
   */
  protected readonly varsMostradas = computed(
    () => this.frameActual()?.resultado.vars.filter((v) => v.cod_block === 1) ?? []
  );

  /** Encabezados de la tabla de ranking — `setHeaders()` del legado. */
  protected readonly encabezadosRanking = computed(() => {
    const tipCod = this.frameActual()?.tipCod ?? 0;
    const nivel = tipCod === 18 ? 'Asesor' : tipCod === 19 ? 'Unidad' : 'Nivel';
    const cv = this.codVarNormalizado();

    if (this.tipoDetalle() === 'sp') {
      if (cv === 6) return { nivel, real: 'Tasa Mes', meta: 'Tasa Mínima', distancia: 'Distancia' };
      if (cv === 1) return { nivel, real: 'Productividad', meta: 'Meta', distancia: 'Distancia' };
      return { nivel, real: 'Real', meta: 'Meta', distancia: 'Distancia' };
    }

    if (cv === 1) return { nivel, real: 'Var. Saldo', meta: 'Meta', distancia: 'Distancia' };
    if (cv === 2) return { nivel, real: 'Var. Clientes', meta: 'Meta', distancia: 'Distancia' };
    return { nivel, real: 'Efectividad', meta: 'Meta', distancia: 'Distancia' };
  });

  /** Formato de cada columna numérica del ranking — `setHeaders()` del legado. */
  protected readonly formatosRanking = computed<{ real: FormatoRanking; meta: FormatoRanking; distancia: FormatoRanking }>(() => {
    const cv = this.codVarNormalizado();

    if (this.tipoDetalle() === 'sp') {
      // La distancia de tasas va en puntos básicos (`pbs` del legado).
      if (cv === 6) return { real: 'porcentaje', meta: 'porcentaje', distancia: 'pbs' };
      if (cv === 1) return { real: 'decimal', meta: 'decimal', distancia: 'decimal' };
      return { real: 'entero', meta: 'entero', distancia: 'entero' };
    }

    // Cartera (1) y Clientes (2) son magnitudes; el resto son efectividades.
    if (cv === 1 || cv === 2) return { real: 'entero', meta: 'entero', distancia: 'entero' };
    return { real: 'porcentaje', meta: 'porcentaje', distancia: 'porcentaje' };
  });

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
        this.toast.error('No se pudo cargar el detalle de la variable', 'Inténtalo de nuevo en unos segundos.');
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
              desLab: this.etiquetaNivel(fila.tip_cod),
              resultado,
            },
          ]);
          this.bloqueExpandido.set(null);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo bajar de nivel', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  /** Etiqueta del nivel al que se bajó en el ranking — mismo `if/else` de `ddEvent()` del legado. */
  private etiquetaNivel(tipCod: number): string {
    if (tipCod === 1) return 'Asesor';
    if (tipCod === 18) return 'Unidad';
    if (tipCod === 19) return 'Corredor';
    if (tipCod === 20) return 'Territorio';
    return 'Total';
  }

  /**
   * Valor de una tarjeta KPI — `getCardsCie()`/`getCardsVar()` del legado:
   * Cartera lleva soles, Clientes va en enteros, las efectividades en
   * porcentaje y los Super Plus con dos decimales.
   */
  protected formatearValorTarjeta(val: number | undefined): string {
    if (val === undefined || val === null) return '--';
    const cv = this.codVarNormalizado();

    if (this.tipoDetalle() === 'cv') {
      if (cv === 1) return `S/. ${this.numero(val, 0, 0)}`;
      if (cv === 2) return this.numero(val, 0, 0);
      return `${this.numero(val * 100, 0, 2)}%`;
    }
    return this.numero(val, 0, 2);
  }

  /** Igual que `formatearValorTarjeta`, pero con el `exis_met == 0` del legado. */
  protected formatearMeta(): string {
    const card = this.frameActual()?.resultado.card;
    if (!card || card.exis_met === 0) return '--';
    return this.formatearValorTarjeta(card.met);
  }

  /**
   * Celda de la tabla de indicadores — `ctFn2` del legado: sin `fmt` la fila
   * se muestra como entero, no con decimales.
   */
  protected formatearCelda(val: number | undefined, fmt?: string): string {
    if (val === undefined || val === null) return '--';
    if (fmt === 'p' || fmt === 'percent') return `${this.numero(val * 100, 0, 1)}%`;
    if (fmt === 'pen') return `S/. ${this.numero(val, 0, 0)}`;
    if (fmt === 'd' || fmt === 'decimal') return this.numero(val, 0, 2);
    return this.numero(val, 0, 0);
  }

  /** Celda de la tabla de ranking, según el formato que le toca a esa columna. */
  protected formatearRanking(val: number | undefined, formato: FormatoRanking): string {
    if (val === undefined || val === null) return '--';
    if (formato === 'porcentaje') return `${this.numero(val * 100, 0, 2)}%`;
    if (formato === 'decimal') return this.numero(val, 0, 2);
    // Puntos básicos: la diferencia de tasas se lee ×10.000 (0,0125 → 125 pbs).
    if (formato === 'pbs') return `${this.numero(val * 10000, 0, 0)} pbs`;
    return this.numero(val, 0, 0);
  }

  /** Avance de la tarjeta de meta, en porcentaje — `card.avan * 100` del legado. */
  protected formatearAvance(avan: number | undefined): string {
    return `${this.numero((avan ?? 0) * 100, 0, 1)}%`;
  }

  private numero(val: number, min: number, max: number): string {
    // Mismo locale que `formatNumber(..., 'en-US', ...)` del legado.
    return val.toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max });
  }
}

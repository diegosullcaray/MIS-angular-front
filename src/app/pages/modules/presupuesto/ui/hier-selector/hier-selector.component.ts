import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { PresupuestoService } from '../../services/presupuesto.service';
import type { HierarquiaNodo, NivelJerarquiaDropdown, ParamsJerarquia } from '../../models/jerarquia.model';

/**
 * Selector de jerarquía organizativa mediante desplegables `<p-select>` por nivel jerárquico.
 * Muestra siempre el texto descriptivo del nodo (ej. "FINANCIERA CONFIANZA") en lugar del código numérico.
 */
@Component({
  selector: 'app-hier-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, ButtonModule],
  templateUrl: './hier-selector.component.html',
  styleUrl: './hier-selector.component.css',
})
export class HierSelectorComponent implements OnInit {
  private readonly presupuesto = inject(PresupuestoService);

  readonly paramsHier = input.required<ParamsJerarquia>();
  /**
   * Título del bloque. Vacío (default) no dibuja encabezado — es lo que quieren
   * las pantallas con un único selector. Las que montan DOS selectores sobre la
   * misma jerarquía (Tablero de Verificación: línea + segundo nivel) lo
   * necesitan sí o sí: sin él se ven dos bloques de filtros idénticos y no hay
   * forma de saber cuál es cuál.
   */
  readonly titulo = input('');
  /**
   * `false` quita el marco propio (fondo, borde, padding) para poder montar
   * varios selectores dentro de UNA sola franja de filtros — si cada uno trae
   * su caja, la pantalla se ve con el filtro duplicado. Igual criterio que en
   * Reportes, donde la franja es siempre una sola.
   */
  readonly conMarco = input(true);
  /** `false` cuando la pantalla ofrece un único "Limpiar" para todos los selectores. */
  readonly mostrarLimpiar = input(true);
  readonly raizFija = input<HierarquiaNodo[] | null>(null);
  /**
   * `true` (default): la raíz queda preseleccionada y se emite al cargar, así la
   * pantalla muestra datos de entrada — es lo que esperan las de Presupuesto.
   *
   * `false`: la raíz se muestra como punto de partida pero NO se emite, y el
   * usuario baja de a un nivel. Lo usan los reportes, donde entrar a la pantalla
   * no debe disparar la consulta de un nodo que nadie eligió.
   */
  readonly autoSeleccionar = input(true);
  readonly nodoSeleccionado = output<HierarquiaNodo>();
  /** Emite cuando la jerarquía no pudo cargarse o vino vacía (ni error HTTP ni nodo alguno) — único caso en que este componente nunca llega a emitir `nodoSeleccionado`. */
  readonly error = output<void>();

  protected readonly nodosNivel = signal<NivelJerarquiaDropdown[]>([]);
  protected readonly valoresSeleccionados = signal<(HierarquiaNodo | null)[]>([]);
  protected readonly cargando = signal(false);

  ngOnInit(): void {
    this.cargarRaiz();
  }

  public limpiar(): void {
    this.nodosNivel.set([]);
    this.valoresSeleccionados.set([]);
    this.cargarRaiz();
  }

  private cargarRaiz(): void {
    const raizFija = this.raizFija();
    if (raizFija && raizFija.length > 0) {
      const primerNodoRaiz = raizFija[0];
      const crls = raizFija.map((item) => item.cod_rel);
      this.cargarNivelInicial(primerNodoRaiz.tip_cod, crls, primerNodoRaiz.lvl ?? 1);
      return;
    }

    this.cargando.set(true);
    this.presupuesto.obtenerJerarquiaBase(this.paramsHier().code).subscribe({
      next: (raiz) => {
        if (raiz && raiz.length > 0) {
          const primerNodoRaiz = raiz[0];
          const crls = raiz.map((item) => item.cod_rel);
          this.cargarNivelInicial(primerNodoRaiz.tip_cod, crls, primerNodoRaiz.lvl ?? 1);
        } else {
          this.cargando.set(false);
          this.error.emit();
        }
      },
      error: () => {
        this.cargando.set(false);
        this.error.emit();
      },
    });
  }

  private cargarNivelInicial(tip_cod: number, cod_rels: string[], lvl: number): void {
    this.cargando.set(true);
    const paramsFec = { key: 'fec', val: this.presupuesto.fechaCorte() };
    this.presupuesto
      .obtenerJerarquiaNivel(this.paramsHier().code, lvl, tip_cod, cod_rels, paramsFec)
      .subscribe({
        next: (lh) => {
          if (lh && lh.length > 0) {
            this.cargando.set(false);
            this.procesarRespuestaNivelInicial(lh, lvl);
          } else {
            // Reintento sin filtro de fecha si la fecha corte actual no devolvió registros
            this.presupuesto
              .obtenerJerarquiaNivel(this.paramsHier().code, lvl, tip_cod, cod_rels)
              .subscribe({
                next: (lhSinFec) => {
                  this.cargando.set(false);
                  if (lhSinFec && lhSinFec.length > 0) {
                    this.procesarRespuestaNivelInicial(lhSinFec, lvl);
                  } else {
                    this.error.emit();
                  }
                },
                error: () => {
                  this.cargando.set(false);
                  this.error.emit();
                },
              });
          }
        },
        error: () => {
          this.presupuesto
            .obtenerJerarquiaNivel(this.paramsHier().code, lvl, tip_cod, cod_rels)
            .subscribe({
              next: (lhSinFec) => {
                this.cargando.set(false);
                if (lhSinFec && lhSinFec.length > 0) {
                  this.procesarRespuestaNivelInicial(lhSinFec, lvl);
                } else {
                  this.error.emit();
                }
              },
              error: () => {
                this.cargando.set(false);
                this.error.emit();
              },
            });
        },
      });
  }

  private procesarRespuestaNivelInicial(lh: HierarquiaNodo[], lvl: number): void {
    const dataNormalizada = lh.map((item) => this.normalizarNodo(item, lvl));
    const primerNodo = dataNormalizada[0];
    const labelNivel = (lh[0] as any).lbl_hier || (lh[0] as any).lbl_node || `Nivel ${lvl}`;

    const dp: NivelJerarquiaDropdown = {
      label: labelNivel,
      level: lvl,
      data: dataNormalizada,
    };

    this.nodosNivel.set([dp]);
    // La raíz se fija siempre como punto de partida, pero solo se emite (y por
    // lo tanto se consulta) cuando la pantalla pidió autoselección.
    this.valoresSeleccionados.set([primerNodo]);
    if (this.autoSeleccionar()) {
      this.nodoSeleccionado.emit(primerNodo);
    }

    const proximoNivel = (primerNodo.lvl ?? lvl) + 1;
    if (proximoNivel <= this.paramsHier().maxLvl) {
      this.cargarNivel(primerNodo.tip_cod, [primerNodo.cod_rel], proximoNivel);
    }
  }

  private cargarNivel(tip_cod: number, cod_rels: string[], lvl: number): void {
    this.cargando.set(true);
    const paramsFec = { key: 'fec', val: this.presupuesto.fechaCorte() };
    this.presupuesto
      .obtenerJerarquiaNivel(this.paramsHier().code, lvl, tip_cod, cod_rels, paramsFec)
      .subscribe({
        next: (lh) => {
          if (lh && lh.length > 0) {
            this.cargando.set(false);
            const dataNormalizada = lh.map((item) => this.normalizarNodo(item, lvl));
            const labelNivel = (lh[0] as any).lbl_hier || (lh[0] as any).lbl_node || `Nivel ${lvl}`;
            const dp: NivelJerarquiaDropdown = { label: labelNivel, level: lvl, data: dataNormalizada };
            this.nodosNivel.set([...this.nodosNivel(), dp]);
          } else {
            this.presupuesto
              .obtenerJerarquiaNivel(this.paramsHier().code, lvl, tip_cod, cod_rels)
              .subscribe({
                next: (lhSinFec) => {
                  this.cargando.set(false);
                  if (!lhSinFec || lhSinFec.length > 0) {
                    const dataNormalizada = lhSinFec.map((item) => this.normalizarNodo(item, lvl));
                    const labelNivel = (lhSinFec[0] as any).lbl_hier || (lhSinFec[0] as any).lbl_node || `Nivel ${lvl}`;
                    const dp: NivelJerarquiaDropdown = { label: labelNivel, level: lvl, data: dataNormalizada };
                    this.nodosNivel.set([...this.nodosNivel(), dp]);
                  }
                },
                error: () => this.cargando.set(false),
              });
          }
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }

  protected onSeleccionarNivel(index: number, val: HierarquiaNodo | null): void {
    if (!val) return;

    // Al seleccionar un nivel, truncamos niveles y selecciones posteriores
    const nuevosNodos = this.nodosNivel().slice(0, index + 1);
    const nuevosValores = this.valoresSeleccionados().slice(0, index);
    nuevosValores[index] = val;

    this.nodosNivel.set(nuevosNodos);
    this.valoresSeleccionados.set(nuevosValores);

    this.nodoSeleccionado.emit(val);

    const proximoNivel = (val.lvl ?? index + 1) + 1;
    if (proximoNivel <= this.paramsHier().maxLvl) {
      this.cargarNivel(val.tip_cod, [val.cod_rel], proximoNivel);
    }
  }

  private normalizarNodo(nodoCrudo: any, nivel: number): HierarquiaNodo {
    const descTexto =
      nodoCrudo.desc_rel ||
      nodoCrudo.des_rel ||
      (nodoCrudo.lbl_node && nodoCrudo.lbl_node !== nodoCrudo.lbl_hier ? nodoCrudo.lbl_node : null) ||
      nodoCrudo.desc ||
      nodoCrudo.nom ||
      nodoCrudo.label ||
      nodoCrudo.name ||
      nodoCrudo.cod_rel;

    const textoLimpio = String(descTexto ?? '').trim();

    return {
      ...nodoCrudo,
      desc_rel: textoLimpio,
      des_rel: textoLimpio,
      lvl: nodoCrudo.lvl ?? nodoCrudo.lvl_hier ?? nivel,
    };
  }
}

import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ReportesService } from '../../services/reportes.service';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models';

export interface NivelJerarquiaDropdown {
  label: string;
  level: number;
  data: HierarquiaNodo[];
}

/**
 * Selector de jerarquía organizativa en cascada horizontal (mismo patrón que
 * `hier-rem-selector` del legado STG) mediante desplegables p-select por cada
 * nivel jerárquico obtenido dinámicamente desde el backend.
 */
@Component({
  selector: 'app-hier-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  templateUrl: './hier-selector.component.html',
  styleUrl: './hier-selector.component.css',
})
export class HierSelectorComponent implements OnInit {
  private readonly reportes = inject(ReportesService);

  readonly paramsHier = input.required<ParamsJerarquia>();
  readonly placeholder = input('Elegir jerarquía');
  readonly nodoSeleccionado = output<HierarquiaNodo>();
  /** Solo se emite si falla o queda vacía la carga inicial (raíz o su primer nivel) — el único caso en que este componente nunca llega a emitir `nodoSeleccionado`, así el contenedor puede apagar su propio loading en vez de quedarse esperando para siempre. */
  readonly error = output<void>();

  protected readonly nodosNivel = signal<NivelJerarquiaDropdown[]>([]);
  protected readonly valoresSeleccionados = signal<(HierarquiaNodo | null)[]>([]);
  protected readonly cargando = signal(false);

  ngOnInit(): void {
    this.cargarRaiz();
  }

  private cargarRaiz(): void {
    this.cargando.set(true);
    this.reportes.obtenerJerarquiaBase(this.paramsHier().code).subscribe({
      next: (raiz) => {
        if (raiz && raiz.length > 0) {
          // Confirmado contra el legado (`hier-rem-selector.component.ts`, log real de
          // producción): la primera llamada a `level_hier` pide el propio nivel de la raíz
          // (`lvl = root.lvl`, típicamente 1) — devuelve la raíz "hidratada" con
          // `des_rel`/`lbl_hier`, no sus hijos. La causa real de la jerarquía vacía era la
          // fecha (`fec`), no el nivel — ver `ReportesService.fechaCorte()`.
          const root = raiz[0];
          this.cargarNivel(root.tip_cod, [root.cod_rel], root.lvl ?? 1, true);
        } else {
          console.warn(`[app-hier-selector] obtenerJerarquiaBase() devolvió una jerarquía vacía — code: ${this.paramsHier().code}`);
          this.cargando.set(false);
          this.error.emit();
        }
      },
      error: (err) => {
        console.error(`[app-hier-selector] obtenerJerarquiaBase() falló — code: ${this.paramsHier().code}`, err);
        this.cargando.set(false);
        this.error.emit();
      },
    });
  }

  private cargarNivel(tip_cod: number, cod_rels: string[], lvl: number, esCargaInicial = false): void {
    this.cargando.set(true);
    const paramsFec = { key: 'fec', val: this.reportes.fechaCorte() };
    this.reportes
      .obtenerJerarquiaNivel(this.paramsHier().code, lvl, tip_cod, cod_rels, paramsFec)
      .subscribe({
        next: (lh) => {
          this.cargando.set(false);
          if (!lh || lh.length === 0) {
            if (esCargaInicial) {
              console.warn(
                `[app-hier-selector] obtenerJerarquiaNivel() devolvió vacío en la carga inicial — params: ${JSON.stringify({
                  code: this.paramsHier().code,
                  lvl,
                  tip_cod,
                  cod_rels,
                  paramsFec,
                })}`
              );
              this.error.emit();
            }
            return;
          }

          const dataNormalizada: HierarquiaNodo[] = lh.map((item: any) => {
            const labelTexto =
              item.des_rel ||
              item.desc_rel ||
              item.lbl_node ||
              item.lbl_hier ||
              item.desc ||
              item.nom ||
              item.label ||
              item.name ||
              item.cod_rel;
            return {
              ...item,
              des_rel: labelTexto,
              desc_rel: labelTexto,
              lvl: item.lvl ?? item.lvl_hier ?? lvl,
            };
          });

          const primerNodo = dataNormalizada[0];
          const labelNivel = (lh[0] as any).lbl_hier || (lh[0] as any).lbl_node || `Nivel ${lvl}`;

          const dp: NivelJerarquiaDropdown = {
            label: labelNivel,
            level: lvl,
            data: dataNormalizada,
          };

          const nodosActuales = [...this.nodosNivel(), dp];
          const seleccionadosActuales = [...this.valoresSeleccionados(), primerNodo];

          this.nodosNivel.set(nodosActuales);
          this.valoresSeleccionados.set(seleccionadosActuales);

          this.nodoSeleccionado.emit(primerNodo);

          const proximoNivel = (primerNodo.lvl ?? lvl) + 1;
          if (proximoNivel <= this.paramsHier().maxLvl && lh && lh.length > 0) {
            this.cargarNivel(primerNodo.tip_cod, [primerNodo.cod_rel], proximoNivel);
          }
        },
        error: (err) => {
          console.error(
            `[app-hier-selector] obtenerJerarquiaNivel() falló — params: ${JSON.stringify({ code: this.paramsHier().code, lvl, tip_cod, cod_rels, paramsFec })}`,
            err
          );
          this.cargando.set(false);
          if (esCargaInicial) this.error.emit();
        },
      });
  }

  protected onSeleccionarNivel(index: number, val: HierarquiaNodo | null): void {
    if (!val) return;

    const nuevosNodos = this.nodosNivel().slice(0, index + 1);
    const nuevosValores = this.valoresSeleccionados().slice(0, index + 1);
    nuevosValores[index] = val;

    this.nodosNivel.set(nuevosNodos);
    this.valoresSeleccionados.set(nuevosValores);

    this.nodoSeleccionado.emit(val);

    const levelAtual = val.lvl ?? index + 1;
    if (levelAtual + 1 <= this.paramsHier().maxLvl) {
      this.cargarNivel(val.tip_cod, [val.cod_rel], levelAtual + 1);
    }
  }
}

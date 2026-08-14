import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ModSysAdminService } from '../../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { fechaCorte } from '../../utils/fecha-reporte.util';
import type { HierarquiaNodo, NivelJerarquiaDropdown, ParamsJerarquia } from '../../models/jerarquia.model';
import type { JerarquiaResponseBody } from '../../models/reportes-api.model';

/**
 * Selector de jerarquía organizativa en cascada horizontal (mismo patrón que
 * `hier-rem-selector` del legado STG) mediante desplegables p-select por cada
 * nivel jerárquico obtenido dinámicamente desde el backend. Único consumidor
 * de `ModSysAdminService` en el módulo `reportes` — habla directo con el
 * backend de jerarquía, sin un service intermedio.
 */
@Component({
  selector: 'app-hier-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, ButtonModule],
  templateUrl: './hier-selector.component.html',
  styleUrl: './hier-selector.component.css',
})
export class HierSelectorComponent implements OnInit {
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);

  readonly paramsHier = input.required<ParamsJerarquia>();
  readonly placeholder = input('Elegir jerarquía');
  /**
   * `true` (default): la raíz queda preseleccionada y se emite al cargar.
   * `false`: la raíz se muestra como punto de partida pero NO se emite —
   * lo usan los reportes, donde entrar a la pantalla no debe disparar la
   * consulta de un nodo que nadie eligió.
   */
  readonly autoSeleccionar = input(true);
  readonly nodoSeleccionado = output<HierarquiaNodo>();
  /** Solo se emite si falla o queda vacía la carga inicial (raíz o su primer nivel) — el único caso en que este componente nunca llega a emitir `nodoSeleccionado`, así el contenedor puede apagar su propio loading en vez de quedarse esperando para siempre. */
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
    this.cargando.set(true);
    const email = this.shell.usuarioActivo()?.email ?? '';

    this.antAdmin
      .getBaseHierarchy(email, this.paramsHier().code)
      .pipe(map((r) => (r.body as JerarquiaResponseBody | null)?.base_hierarchy ?? []))
      .subscribe({
        next: (raiz) => {
          if (raiz && raiz.length > 0) {
            // La primera llamada a `level_hier` pide el propio nivel de la raíz
            // (`lvl = root.lvl`): devuelve la raíz hidratada con `des_rel`/`lbl_hier`,
            // no sus hijos.
            const root = raiz[0];
            this.cargarNivel(root.tip_cod, [root.cod_rel], root.lvl ?? 1, true);
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

  private cargarNivel(tip_cod: number, cod_rels: string[], lvl: number, esCargaInicial = false): void {
    this.cargando.set(true);
    const paramsFec = { key: 'fec', val: fechaCorte(this.shell.usuarioActivo()?.fechaCorte) };

    this.antAdmin
      .getLevelHierarchy(this.paramsHier().code, lvl, tip_cod, cod_rels, paramsFec)
      .pipe(map((r) => (r.body as JerarquiaResponseBody | null)?.level_hierarchy ?? []))
      .subscribe({
        next: (lh) => {
          this.cargando.set(false);
          if (!lh || lh.length === 0) {
            if (esCargaInicial) this.error.emit();
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

          if (esCargaInicial) {
            this.nodosNivel.set([dp]);
            this.valoresSeleccionados.set([primerNodo]);
            if (this.autoSeleccionar()) {
              this.nodoSeleccionado.emit(primerNodo);
            }

            const proximoNivel = (primerNodo.lvl ?? lvl) + 1;
            if (proximoNivel <= this.paramsHier().maxLvl && lh && lh.length > 0) {
              this.cargarNivel(primerNodo.tip_cod, [primerNodo.cod_rel], proximoNivel, false);
            }
          } else {
            this.nodosNivel.set([...this.nodosNivel(), dp]);
          }
        },
        error: (err) => {
          console.error(
            `[app-hier-selector] getLevelHierarchy() falló — params: ${JSON.stringify({ code: this.paramsHier().code, lvl, tip_cod, cod_rels, paramsFec })}`,
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
    const nuevosValores = this.valoresSeleccionados().slice(0, index);
    nuevosValores[index] = val;

    this.nodosNivel.set(nuevosNodos);
    this.valoresSeleccionados.set(nuevosValores);

    this.nodoSeleccionado.emit(val);

    const proximoNivel = (val.lvl ?? index + 1) + 1;
    if (proximoNivel <= this.paramsHier().maxLvl) {
      this.cargarNivel(val.tip_cod, [val.cod_rel], proximoNivel, false);
    }
  }
}

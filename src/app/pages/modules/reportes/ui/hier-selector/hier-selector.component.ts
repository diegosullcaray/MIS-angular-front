import { Component, inject, input, output, signal } from '@angular/core';
import { TreeModule } from 'primeng/tree';
import type { TreeNodeExpandEvent, TreeNodeSelectEvent } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import type { TreeNode } from 'primeng/api';
import { ReportesService } from '../../services/reportes.service';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models';

/**
 * Selector de jerarquía organizativa — mismo patrón que `HierSelectorComponent`
 * de Presupuesto (`presupuesto/ui/hier-selector`), reconstrucción del
 * `hier-rem-selector` legado (componente compartido de otro paquete de STG).
 * Botón que abre un diálogo con un árbol de expansión perezosa (`base_hier` →
 * `level_hier` por cada nodo expandido), hasta `paramsHier().maxLvl` niveles.
 *
 * Copia local (no un componente compartido entre módulos) a propósito: cada
 * pantalla de Reportes tiene su propio nivel de jerarquía elegido, sin
 * compartir estado con Presupuesto/Incentivos — mismo criterio que ya usan
 * esos módulos entre sí (nada de componentes UI cruzados entre `pages/modules/*`
 * en este Host).
 */
@Component({
  selector: 'app-hier-selector',
  standalone: true,
  imports: [TreeModule, ButtonModule, DialogModule],
  templateUrl: './hier-selector.component.html',
  styleUrl: './hier-selector.component.css',
})
export class HierSelectorComponent {
  private readonly reportes = inject(ReportesService);

  readonly paramsHier = input.required<ParamsJerarquia>();
  /** Etiqueta del botón mientras no se eligió ningún nodo. */
  readonly placeholder = input('Elegir jerarquía');
  readonly nodoSeleccionado = output<HierarquiaNodo>();

  protected readonly dialogAbierto = signal(false);
  protected readonly nodos = signal<TreeNode<HierarquiaNodo>[]>([]);
  protected readonly cargandoRaiz = signal(false);
  protected readonly etiquetaActual = signal<string | null>(null);

  private raizCargada = false;

  protected abrir(): void {
    this.dialogAbierto.set(true);
    if (!this.raizCargada) {
      this.cargarRaiz();
    }
  }

  private cargarRaiz(): void {
    this.raizCargada = true;
    this.cargandoRaiz.set(true);

    this.reportes.obtenerJerarquiaBase(this.paramsHier().code).subscribe({
      next: (raiz) => {
        this.nodos.set(raiz.map((nodo) => this.aNodoArbol(nodo, 1)));
        this.cargandoRaiz.set(false);
      },
      error: () => {
        this.cargandoRaiz.set(false);
        this.raizCargada = false;
      },
    });
  }

  protected onExpandir(event: TreeNodeExpandEvent): void {
    const arbol = event.node as TreeNode<HierarquiaNodo>;
    if (arbol.leaf || (arbol.children && arbol.children.length > 0)) return;

    const nodo = arbol.data;
    if (!nodo) return;

    const nivelHijos = (nodo.lvl ?? 1) + 1;
    arbol.loading = true;

    this.reportes
      .obtenerJerarquiaNivel(this.paramsHier().code, nivelHijos, nodo.tip_cod, [nodo.cod_rel], {
        key: 'fec',
        val: this.reportes.fechaCorte(),
      })
      .subscribe({
        next: (hijos) => {
          arbol.children = hijos.map((hijo) => this.aNodoArbol(hijo, nivelHijos));
          arbol.loading = false;
          this.nodos.set([...this.nodos()]);
        },
        error: () => {
          arbol.loading = false;
        },
      });
  }

  protected onSeleccionar(event: TreeNodeSelectEvent): void {
    const arbol = event.node as TreeNode<HierarquiaNodo>;
    if (!arbol.data) return;

    this.etiquetaActual.set(arbol.label ?? null);
    this.dialogAbierto.set(false);
    this.nodoSeleccionado.emit(arbol.data);
  }

  private aNodoArbol(nodoCrudo: HierarquiaNodo, nivel: number): TreeNode<HierarquiaNodo> {
    const nodo: HierarquiaNodo = { ...nodoCrudo, lvl: nivel };
    return {
      key: `${nivel}-${nodo.tip_cod}-${nodo.cod_rel}`,
      label: nodo.desc_rel,
      data: nodo,
      leaf: nivel >= this.paramsHier().maxLvl,
    };
  }
}

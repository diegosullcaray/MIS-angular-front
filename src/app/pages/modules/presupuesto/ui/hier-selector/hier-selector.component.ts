import { Component, inject, input, output, signal } from '@angular/core';
import { TreeModule } from 'primeng/tree';
import type { TreeNodeExpandEvent, TreeNodeSelectEvent } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import type { TreeNode } from 'primeng/api';
import { PresupuestoService } from '../../services/presupuesto.service';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models';

/**
 * Selector de jerarquía organizativa — reconstrucción del `hier-rem-selector`
 * legado (componente compartido de otro paquete de STG, no incluido en el
 * volcado de referencia de `docs/07-modulos/presupuesto`). Botón que abre un
 * diálogo con un árbol de expansión perezosa (`base_hier` → `level_hier` por
 * cada nodo expandido), hasta `paramsHier().maxLvl` niveles de profundidad.
 *
 * Emite el nodo elegido tal cual lo usaba el legado (`onSelectHier`, un solo
 * elemento por selector — quien necesite combinar 2 selectores, como el
 * Tablero de Verificación, renderiza dos instancias de este componente).
 */
@Component({
  selector: 'app-hier-selector',
  standalone: true,
  imports: [TreeModule, ButtonModule, DialogModule, SkeletonModule],
  templateUrl: './hier-selector.component.html',
  styleUrl: './hier-selector.component.css',
})
export class HierSelectorComponent {
  private readonly presupuesto = inject(PresupuestoService);

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

    this.presupuesto.obtenerJerarquiaBase(this.paramsHier().code).subscribe({
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

    this.presupuesto
      .obtenerJerarquiaNivel(this.paramsHier().code, nivelHijos, nodo.tip_cod, [nodo.cod_rel], {
        key: 'fec',
        val: this.presupuesto.fechaCorte(),
      })
      .subscribe({
        next: (hijos) => {
          arbol.children = hijos.map((hijo) => this.aNodoArbol(hijo, nivelHijos));
          arbol.loading = false;
          // Nueva referencia de arreglo raíz para que el árbol detecte el cambio.
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
      label: nodo.des_rel,
      data: nodo,
      leaf: nivel >= this.paramsHier().maxLvl,
    };
  }
}

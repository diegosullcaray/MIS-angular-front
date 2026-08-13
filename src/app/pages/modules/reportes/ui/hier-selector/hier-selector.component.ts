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
 *
 * Arranca en la raíz ("Financiera") y baja **un nivel por vez**: cada nivel
 * nuevo se muestra sin preselección y `nodoSeleccionado` se emite únicamente
 * cuando el usuario elige. La raíz queda fijada como punto de partida pero no
 * emite, así que al entrar no se pide ningún reporte.
 *
 * Equivale al `combineLatest([filter$, level$])` de `ReportCraV1p1Component`
 * en el legado: `level$` solo emitía desde `(onSelectHier)`, nunca al cargar.
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
  /** Falló o vino vacía la jerarquía: el selector queda inutilizable y el contenedor lo avisa. */
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

  private cargarNivel(tip_cod: number, cod_rels: string[], lvl: number, esRaiz = false): void {
    this.cargando.set(true);
    const paramsFec = { key: 'fec', val: this.reportes.fechaCorte() };
    this.reportes
      .obtenerJerarquiaNivel(this.paramsHier().code, lvl, tip_cod, cod_rels, paramsFec)
      .subscribe({
        next: (lh) => {
          this.cargando.set(false);
          if (!lh || lh.length === 0) {
            // Sin hijos: se llegó a la hoja de la jerarquía, no hay más que ofrecer.
            if (esRaiz) this.error.emit();
            return;
          }

          const dataNormalizada = lh.map((item) => this.normalizar(item, lvl));
          const primero = lh[0] as unknown as Record<string, unknown>;

          this.nodosNivel.update((niveles) => [
            ...niveles,
            {
              label: (primero['lbl_hier'] as string) || (primero['lbl_node'] as string) || `Nivel ${lvl}`,
              level: lvl,
              data: dataNormalizada,
            },
          ]);

          if (esRaiz) {
            // La raíz es el punto de partida, no una elección del usuario:
            // se fija en el primer desplegable y se bajan sus hijos, pero no
            // se emite — al entrar no debe pedirse ningún reporte.
            const raiz = dataNormalizada[0];
            this.valoresSeleccionados.update((valores) => [...valores, raiz]);
            this.cargarSiguienteNivel(raiz, lvl);
          } else {
            // Nivel a elegir: sin preselección, para que el usuario baje de a uno.
            this.valoresSeleccionados.update((valores) => [...valores, null]);
          }
        },
        error: () => {
          this.cargando.set(false);
          if (esRaiz) this.error.emit();
        },
      });
  }

  /** Pide los hijos de `nodo` si la jerarquía todavía no llegó a `maxLvl`. */
  private cargarSiguienteNivel(nodo: HierarquiaNodo, lvlActual: number): void {
    const siguiente = (nodo.lvl ?? lvlActual) + 1;
    if (siguiente <= this.paramsHier().maxLvl) {
      this.cargarNivel(nodo.tip_cod, [nodo.cod_rel], siguiente);
    }
  }

  /** El backend nombra la etiqueta del nodo distinto según el nivel y la ruta. */
  private normalizar(item: HierarquiaNodo, lvl: number): HierarquiaNodo {
    const crudo = item as unknown as Record<string, unknown>;
    const label =
      (crudo['des_rel'] ||
        crudo['desc_rel'] ||
        crudo['lbl_node'] ||
        crudo['lbl_hier'] ||
        crudo['desc'] ||
        crudo['nom'] ||
        crudo['label'] ||
        crudo['name'] ||
        crudo['cod_rel']) as string;

    return {
      ...item,
      des_rel: label,
      desc_rel: label,
      lvl: (crudo['lvl'] as number) ?? (crudo['lvl_hier'] as number) ?? lvl,
    };
  }

  protected onSeleccionarNivel(index: number, val: HierarquiaNodo | null): void {
    if (!val) return;

    // Elegir en un nivel invalida todo lo que colgaba debajo.
    const nuevosValores = this.valoresSeleccionados().slice(0, index + 1);
    nuevosValores[index] = val;

    this.nodosNivel.update((niveles) => niveles.slice(0, index + 1));
    this.valoresSeleccionados.set(nuevosValores);

    // Única vía por la que se pide un reporte.
    this.nodoSeleccionado.emit(val);

    this.cargarSiguienteNivel(val, index + 1);
  }
}

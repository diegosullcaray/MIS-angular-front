import { Signal, WritableSignal, computed, effect, signal, untracked } from '@angular/core';
import { AnalistaService } from '../services/analista.service';
import type { ColaboradorActivo, ColaboradorItem, NodoJerarquiaAncla } from '../models/colaborador.model';

/** Selector de colaborador (admin), compartido por Principal, Becas y Priorización de Leads — antes copiado y pegado en cada componente. */
export interface SelectorColaborador {
  readonly esAdmin: Signal<boolean>;
  readonly colaboradorActivo: Signal<ColaboradorActivo | null>;
  readonly dialogAbierto: WritableSignal<boolean>;
  readonly colaboradores: Signal<ColaboradorItem[]>;
  readonly cargando: Signal<boolean>;
  /** Resuelve el colaborador propio, o el nodo ancla del admin en la jerarquía. */
  inicializar(): void;
  abrir(): void;
  seleccionar(item: ColaboradorItem): void;
}

export function crearSelectorColaborador(analista: AnalistaService): SelectorColaborador {
  const dialogAbierto = signal(false);
  const colaboradores = signal<ColaboradorItem[]>([]);
  const cargando = signal(false);
  const ancla = signal<NodoJerarquiaAncla | null>(null);
  const cargandoAncla = signal(false);

  function cargarColaboradores(nodo: NodoJerarquiaAncla): void {
    analista.obtenerColaboradores(nodo.tip_cod, nodo.cod_rel).subscribe({
      next: (lista) => {
        colaboradores.set(lista);
        cargando.set(false);
      },
      error: () => cargando.set(false),
    });
  }

  // Carga cuando el diálogo esté abierto Y el ancla resuelta: intentarlo una sola vez al abrir dejaba el diálogo vacío para siempre.
  effect(() => {
    if (!dialogAbierto() || colaboradores().length > 0 || cargandoAncla()) return;

    const nodo = ancla();
    if (!nodo) {
      untracked(() => cargando.set(false));
      return;
    }
    untracked(() => cargarColaboradores(nodo));
  });

  return {
    esAdmin: computed(() => analista.esAdmin()),
    colaboradorActivo: analista.colaboradorActivo,
    dialogAbierto,
    colaboradores,
    cargando,

    inicializar(): void {
      if (analista.esAdmin()) {
        cargandoAncla.set(true);
        analista.obtenerAnclaAdmin().subscribe({
          next: (nodo) => {
            ancla.set(nodo);
            cargandoAncla.set(false);
          },
          error: () => cargandoAncla.set(false),
        });
      } else {
        analista.usarColaboradorPropio();
      }
    },

    abrir(): void {
      dialogAbierto.set(true);
      if (colaboradores().length === 0) cargando.set(true);
    },

    seleccionar(item: ColaboradorItem): void {
      analista.establecerColaborador(item);
    },
  };
}

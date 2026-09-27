import { signal } from '@angular/core';
import type { HierarquiaNodo } from './jerarquia.model';

export class NavegacionJerarquica {
  readonly ruta = signal<HierarquiaNodo[]>([]);

  constructor(
    private readonly intentarSeleccionar: (nodo: HierarquiaNodo) => boolean,
    private readonly seleccionar: (nodo: HierarquiaNodo) => void,
  ) {}

  descender(nodo: HierarquiaNodo): void {
    if (this.intentarSeleccionar(nodo)) return;
    this.ruta.update((ruta) => [...ruta, nodo]);
    this.seleccionar(nodo);
  }

  volver(indice: number): void {
    const ruta = this.ruta();
    const nodo = ruta[indice];
    if (!nodo || indice === ruta.length - 1) return;
    if (this.intentarSeleccionar(nodo)) return;
    this.ruta.set(ruta.slice(0, indice + 1));
    this.seleccionar(nodo);
  }
}

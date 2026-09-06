import { Injectable, signal } from '@angular/core';

/** El breakpoint `sm` de Tailwind, que es el que usa todo el shell. */
const ANGOSTA = '(max-width: 639px)';

/** Ancho del viewport como señal, para lo que no se puede resolver solo con CSS. */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly _angosta = signal(false);

  /** `true` por debajo del breakpoint `sm`. */
  readonly angosta = this._angosta.asReadonly();

  constructor() {
    const media = window.matchMedia?.(ANGOSTA);
    if (!media) return;

    this._angosta.set(media.matches);
    media.addEventListener('change', (e) => this._angosta.set(e.matches));
  }
}

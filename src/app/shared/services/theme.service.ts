import { Injectable, computed, signal } from '@angular/core';
import type { ModoTema } from '../../core/preferencias/dominio/preferencias.model';

export type { ModoTema };

/** Tema con el que arranca el sistema mientras el usuario no elija otro. */
const MODO_POR_DEFECTO: ModoTema = 'oscuro';

/**
 * Adaptador del tema claro/oscuro: resuelve el modo `sistema` contra
 * `prefers-color-scheme` y refleja el resultado en la clase `.dark` de
 * `<html>` —el mismo selector que declara `providePrimeNG`.
 *
 * No persiste nada. La preferencia vive en `PreferenciasService`, que es quien
 * llama a `setModo` al arrancar y en cada cambio; separarlo evita tener el tema
 * guardado en dos sitios y hace que el borrado de sesión sea uno solo.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _modo = signal<ModoTema>(MODO_POR_DEFECTO);
  private readonly _sistemaOscuro = signal(this.consultarSistema());

  /** Preferencia vigente (`sistema` sigue al sistema operativo). */
  readonly modo = this._modo.asReadonly();

  /** Tema efectivamente aplicado, ya resuelto el modo `sistema`. */
  readonly oscuro = computed(() =>
    this._modo() === 'sistema' ? this._sistemaOscuro() : this._modo() === 'oscuro'
  );

  constructor() {
    this.observarSistema();
    this.aplicar();
  }

  setModo(modo: ModoTema): void {
    this._modo.set(modo);
    this.aplicar();
  }

  private aplicar(): void {
    const oscuro = this.oscuro();
    document.documentElement.classList.toggle('dark', oscuro);
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
  }

  private consultarSistema(): boolean {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private observarSistema(): void {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    // Hay entornos (jsdom, Safari < 14) con MediaQueryList sin `addEventListener`; sin él el tema funciona pero no sigue los cambios del sistema.
    if (typeof media?.addEventListener !== 'function') return;

    media.addEventListener('change', (e) => {
      this._sistemaOscuro.set(e.matches);
      this.aplicar();
    });
  }
}

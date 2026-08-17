import { Injectable, computed, signal } from '@angular/core';

export type ModoTema = 'claro' | 'oscuro' | 'sistema';

const STORAGE_KEY = 'mis-tema';
const MODOS: readonly ModoTema[] = ['claro', 'oscuro', 'sistema'];

/** Tema con el que arranca el sistema mientras el usuario no elija otro. */
const MODO_POR_DEFECTO: ModoTema = 'oscuro';

/**
 * Tema claro/oscuro del Host.
 *
 * Arranca en `oscuro` (`MODO_POR_DEFECTO`) — no en `sistema` — y solo cambia
 * si el usuario elige un tema; esa elección queda guardada y manda sobre el
 * arranque. El mismo valor lo replica el script de `index.html` para pintar la
 * clase `.dark` antes del primer frame.
 *
 * `oscuro` se aplica como clase `.dark` en `<html>` — el mismo selector que
 * declara `providePrimeNG({ theme: { options: { darkModeSelector } } })`, así
 * los tokens `--mis-*` y el tema de PrimeNG cambian juntos.
 *
 * La clase se escribe de forma síncrona en cada mutación en vez de con un
 * `effect()`: el effect recién corre en la siguiente detección de cambios, y
 * eso alcanza para ver un parpadeo del tema anterior.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _modo = signal<ModoTema>(this.leerPreferencia());
  private readonly _sistemaOscuro = signal(this.consultarSistema());

  /** Preferencia elegida por el usuario (`sistema` sigue al sistema operativo). */
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
    try {
      localStorage.setItem(STORAGE_KEY, modo);
    } catch {
      // Modo privado / storage bloqueado: el tema sigue vivo en memoria.
    }
  }

  /** Alterna claro ↔ oscuro tomando el tema visible como punto de partida. */
  alternar(): void {
    this.setModo(this.oscuro() ? 'claro' : 'oscuro');
  }

  private aplicar(): void {
    const oscuro = this.oscuro();
    document.documentElement.classList.toggle('dark', oscuro);
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
  }

  private leerPreferencia(): ModoTema {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return MODOS.includes(guardado as ModoTema) ? (guardado as ModoTema) : MODO_POR_DEFECTO;
    } catch {
      return MODO_POR_DEFECTO;
    }
  }

  private consultarSistema(): boolean {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private observarSistema(): void {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    // No alcanza con comprobar `media`: hay entornos (jsdom, Safari < 14) que
    // devuelven un MediaQueryList sin `addEventListener`. Sin el listener el
    // tema igual funciona, solo deja de seguir cambios del sistema en vivo.
    if (typeof media?.addEventListener !== 'function') return;

    media.addEventListener('change', (e) => {
      this._sistemaOscuro.set(e.matches);
      this.aplicar();
    });
  }
}

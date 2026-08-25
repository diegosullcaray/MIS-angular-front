import { Injectable, computed, signal } from '@angular/core';

export type ModoTema = 'claro' | 'oscuro' | 'sistema';

const STORAGE_KEY = 'mis-tema';
const MODOS: readonly ModoTema[] = ['claro', 'oscuro', 'sistema'];

/** Tema con el que arranca el sistema mientras el usuario no elija otro. */
const MODO_POR_DEFECTO: ModoTema = 'oscuro';

/** Tema claro/oscuro del Host. Arranca en `oscuro` (`MODO_POR_DEFECTO`) — no en `sistema` — y solo cambia si el usuario elige un tema; esa elección queda guardada y manda sobre el arranque. */
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
    // Hay entornos (jsdom, Safari < 14) con MediaQueryList sin `addEventListener`; sin él el tema funciona pero no sigue los cambios del sistema.
    if (typeof media?.addEventListener !== 'function') return;

    media.addEventListener('change', (e) => {
      this._sistemaOscuro.set(e.matches);
      this.aplicar();
    });
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { PreferenciasService } from './preferencias.service';
import { ComunicadosSesionService } from './comunicados-sesion.service';
import { CATALOGO_ANUNCIOS } from '../interfaces/anuncio.model';
import { comunicadoVigente, estaPendiente } from '../interfaces/anuncio.model';

/**
 * Caso de uso del comunicado del sistema.
 *
 * Los dos botones del pie del diálogo NO son sinónimos, y esa es la corrección
 * de la incidencia:
 *
 * - **Entendido** (`cerrar()`) lo calla mientras dure esta sesión de
 *   navegación. Es también lo que ocurre al hacer clic fuera del diálogo.
 * - **No mostrar este comunicado** (`noMostrarEste()`) lo calla de forma
 *   permanente, guardando su id en las preferencias.
 *
 * El interruptor que apaga *todos* los comunicados es otra cosa y vive en
 * Configuración (`PreferenciasService.setSilenciarAnuncios`).
 */
@Injectable({ providedIn: 'root' })
export class AnunciosService {
  private readonly catalogo = inject(CATALOGO_ANUNCIOS);
  private readonly preferencias = inject(PreferenciasService);
  private readonly sesion = inject(ComunicadosSesionService);

  /** Se levanta una sola vez por sesión, al entrar; navegar no lo vuelve a subir. */
  private readonly _abierto = signal(false);
  readonly abierto = this._abierto.asReadonly();

  /** El comunicado publicado hoy — hay uno solo a la vez, o ninguno. */
  readonly comunicado = computed(() => comunicadoVigente(this.catalogo, this.hoy()));

  /** `true` si el usuario todavía no lo cerró: es lo que enciende el punto del header. */
  readonly hayPendientes = computed(() => {
    const pieza = this.comunicado();
    if (!pieza) return false;
    if (this.sesion.yaLeido(pieza.id)) return false;
    return estaPendiente(pieza, this.preferencias.anuncios().vistos);
  });

  /** Abre el diálogo si hay algo nuevo y no está silenciado. */
  abrirSiCorresponde(): void {
    if (this.preferencias.anuncios().silenciar) return;
    if (!this.hayPendientes()) return;
    this._abierto.set(true);
  }

  /** Abre el diálogo a pedido del usuario, aunque ya lo haya leído. */
  abrir(): void {
    this._abierto.set(true);
  }

  /** "Entendido" y el clic fuera: se calla hasta la próxima sesión. */
  cerrar(): void {
    const comunicado = this.comunicado();
    if (comunicado) this.sesion.marcar(comunicado.id);
    this._abierto.set(false);
  }

  /** "No mostrar este comunicado": lo da por leído de forma permanente. */
  noMostrarEste(): void {
    const comunicado = this.comunicado();
    if (comunicado) this.preferencias.marcarAnunciosVistos([comunicado.id]);
    this.cerrar();
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

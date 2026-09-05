import { Injectable, computed, inject, signal } from '@angular/core';
import { PreferenciasService } from './preferencias.service';
import { CATALOGO_ANUNCIOS } from '../dominio/anuncios.puerto';
import { comunicadoVigente, estaPendiente } from '../dominio/anuncio.model';

/** Caso de uso del comunicado del sistema. */
@Injectable({ providedIn: 'root' })
export class AnunciosService {
  private readonly catalogo = inject(CATALOGO_ANUNCIOS);
  private readonly preferencias = inject(PreferenciasService);

  /** Se levanta una sola vez por sesión, al entrar; navegar no lo vuelve a subir. */
  private readonly _abierto = signal(false);
  readonly abierto = this._abierto.asReadonly();

  /** El comunicado publicado hoy — hay uno solo a la vez, o ninguno. */
  readonly comunicado = computed(() => comunicadoVigente(this.catalogo, this.hoy()));

  /** `true` si el usuario todavía no lo cerró: es lo que enciende el punto del header. */
  readonly hayPendientes = computed(() =>
    estaPendiente(this.comunicado(), this.preferencias.anuncios().vistos),
  );

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

  /** Cierra el diálogo marcando el comunicado como visto. */
  cerrar(): void {
    const comunicado = this.comunicado();
    if (comunicado) this.preferencias.marcarAnunciosVistos([comunicado.id]);
    this._abierto.set(false);
  }

  /** "No volver a mostrarme comunicados": apaga el diálogo hasta que se reactive. */
  silenciar(): void {
    this.preferencias.setSilenciarAnuncios(true);
    this.cerrar();
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

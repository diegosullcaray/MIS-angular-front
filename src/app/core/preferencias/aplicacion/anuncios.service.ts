import { Injectable, computed, inject, signal } from '@angular/core';
import { PreferenciasService } from './preferencias.service';
import { CATALOGO_ANUNCIOS } from '../dominio/anuncios.puerto';
import { anunciosPendientes } from '../dominio/anuncio.model';

/**
 * Caso de uso de los anuncios del sistema.
 *
 * El requerimiento era concreto: el diálogo spameaba en cada inicio de sesión.
 * La corrección no es un `if` en el componente sino una regla de dominio
 * (`anunciosPendientes`) alimentada por los ids que el usuario ya cerró, que
 * viven en las preferencias. Un anuncio se muestra una vez; si no queda
 * ninguno pendiente, el diálogo directamente no se abre.
 */
@Injectable({ providedIn: 'root' })
export class AnunciosService {
  private readonly catalogo = inject(CATALOGO_ANUNCIOS);
  private readonly preferencias = inject(PreferenciasService);

  /** Se levanta una sola vez por sesión, al entrar; navegar no lo vuelve a subir. */
  private readonly _abierto = signal(false);
  readonly abierto = this._abierto.asReadonly();

  /** Anuncios vigentes que este usuario todavía no cerró. */
  readonly pendientes = computed(() =>
    anunciosPendientes(this.catalogo, this.preferencias.anuncios().vistos, this.hoy()),
  );

  /** Todo el catálogo vigente, visto o no: es lo que muestra el panel de configuración. */
  readonly historial = computed(() => anunciosPendientes(this.catalogo, [], this.hoy()));

  readonly hayPendientes = computed(() => this.pendientes().length > 0);

  /**
   * Abre el diálogo si —y solo si— hay algo nuevo que decir y el usuario no
   * silenció los anuncios. Es idempotente: llamarlo dos veces en la misma
   * sesión no reabre nada.
   */
  abrirSiCorresponde(): void {
    if (this.preferencias.anuncios().silenciar) return;
    if (!this.hayPendientes()) return;
    this._abierto.set(true);
  }

  /** Abre el diálogo a pedido del usuario, aunque no haya nada pendiente. */
  abrir(): void {
    this._abierto.set(true);
  }

  /**
   * Cierra el diálogo dando por vistos los anuncios que mostró. Ese registro es
   * lo que evita que el mismo aviso vuelva en el próximo inicio de sesión.
   */
  cerrar(): void {
    this.preferencias.marcarAnunciosVistos(this.pendientes().map((a) => a.id));
    this._abierto.set(false);
  }

  /** "No volver a mostrarme anuncios": apaga el diálogo hasta que se reactive. */
  silenciar(): void {
    this.preferencias.setSilenciarAnuncios(true);
    this.cerrar();
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

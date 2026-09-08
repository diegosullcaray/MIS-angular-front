import { Component, computed, effect, inject, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AnunciosService } from '../../../../../../core/preferencias/aplicacion/anuncios.service';
import { laminaEnRango, laminasDe } from '../../../../../../core/preferencias/dominio/anuncio.model';

/**
 * Diálogo del comunicado. Muestra las piezas tal como las publica Comunicación
 * Interna, y cuando el comunicado trae varias láminas las recorre como
 * carrusel: una a la vez, con flechas, indicadores y teclado.
 *
 * Un comunicado de una sola lámina se ve exactamente igual que antes —sin
 * flechas ni indicadores—, porque el recorrido se resuelve sobre la lista que
 * devuelve `laminasDe()`: una lámina o diez siguen el mismo camino.
 *
 * El carrusel es propio y no `p-galleria` por una razón de tamaño: el diálogo
 * se ajusta a la pieza, y Galleria exige fijar las medidas de su contenedor.
 * Adoptarlo obligaba a pelear su layout para recuperar el ajuste que este
 * diálogo ya tenía. Los controles sí son `p-button`, para que el foco, el
 * tamaño y el color salgan del sistema de diseño y no de CSS suelto.
 *
 * Se abre solo cuando `AnunciosService` dice que hay algo pendiente —esa es la
 * corrección al aviso que salía en cada inicio de sesión— y también a pedido,
 * desde el botón de comunicados del header. Cerrarlo lo da por leído.
 */
@Component({
  selector: 'app-anuncios-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: './anuncios-dialog.component.html',
  styleUrl: './anuncios-dialog.component.css',
})
export class AnunciosDialogComponent {
  protected readonly anuncios = inject(AnunciosService);

  protected readonly comunicado = this.anuncios.comunicado;

  /** Las láminas del comunicado vigente. Vacío si no hay comunicado. */
  protected readonly laminas = computed(() => {
    const pieza = this.comunicado();
    return pieza ? laminasDe(pieza) : [];
  });

  protected readonly total = computed(() => this.laminas().length);

  /** `false` para un comunicado de una sola pieza: no hay nada que recorrer. */
  protected readonly esCarrusel = computed(() => this.total() > 1);

  /**
   * Un comunicado de una pieza deja que el diálogo se ajuste a la imagen, que
   * es como se veía siempre. Uno de varias FIJA el ancho: si cada lámina
   * mandara el suyo, la ventana cambiaría de tamaño en cada paso y el usuario
   * perdería el punto de referencia. Se fija acá, en el diálogo, y no en una
   * caja interna: una caja de alto fijo terminaba recortada por el
   * `overflow: hidden` del contenido y dejaba los indicadores fuera de alcance.
   */
  protected readonly estiloDialogo = computed(() =>
    this.esCarrusel()
      ? { width: 'min(880px, 96vw)', maxWidth: 'min(880px, 96vw)' }
      : { width: 'auto', maxWidth: 'min(880px, 96vw)' },
  );

  private readonly _indice = signal(0);
  protected readonly indice = this._indice.asReadonly();

  protected readonly laminaActual = computed(() => this.laminas()[this.indice()]);

  /**
   * Reabrirlo siempre empieza por la primera lámina. Sin esto, quien cerró el
   * diálogo en la lámina 3 lo reabre ahí y parece que se perdió el principio.
   * Depende también de `comunicado` para cubrir el cambio de pieza publicada.
   */
  private readonly reiniciarAlAbrir = effect(() => {
    this.anuncios.abierto();
    this.comunicado();
    this._indice.set(0);
  });

  protected irA(indice: number): void {
    this._indice.set(laminaEnRango(indice, this.total()));
  }

  protected anterior(): void {
    this.irA(this.indice() - 1);
  }

  protected siguiente(): void {
    this.irA(this.indice() + 1);
  }

  /** Flechas del teclado sobre el visor, como en cualquier galería. */
  protected onTecla(evento: KeyboardEvent): void {
    if (!this.esCarrusel()) return;

    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      this.anterior();
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      this.siguiente();
    }
  }

  protected cerrar(): void {
    this.anuncios.cerrar();
  }

  protected silenciar(): void {
    this.anuncios.silenciar();
  }
}

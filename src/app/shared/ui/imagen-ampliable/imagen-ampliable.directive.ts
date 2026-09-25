import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Image } from 'primeng/image';

/**
 * Hace que la vista previa de un `p-image` cubra toda la pantalla.
 *
 * `p-image` de PrimeNG 21 con `appendTo="body"` mueve al `<body>` solo el
 * contenedor de la imagen ampliada: la máscara (`.p-image-mask`, el fondo
 * oscuro a pantalla completa) se queda dentro del componente. Un ancestro con
 * `backdrop-filter` —la ventana `.mis-window` y las tarjetas de vidrio lo
 * tienen— se vuelve el bloque contenedor de ese `position: fixed`, y la vista
 * previa quedaba encerrada en la tarjeta o en el panel.
 *
 * Al abrirse, la máscara también se lleva al `<body>`; PrimeNG la sigue
 * manejando (cerrar, Esc, clic afuera) y Angular la retira al ocultarla.
 */
@Directive({
  selector: 'p-image[appImagenAmpliable]',
  standalone: true,
})
export class ImagenAmpliableDirective {
  private readonly imagen = inject(Image);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private mascara: HTMLElement | null = null;

  constructor() {
    const alMostrar = this.imagen.onShow.subscribe(() => this.llevarAlBody());
    inject(DestroyRef).onDestroy(() => {
      alMostrar.unsubscribe();
      // Si la pantalla se destruye con la vista previa abierta, no dejar la máscara huérfana.
      if (this.mascara?.parentElement === this.document.body) this.mascara.remove();
      this.mascara = null;
    });
  }

  private llevarAlBody(): void {
    const mascara = this.host.nativeElement.querySelector<HTMLElement>('.p-image-mask');
    if (!mascara || mascara.parentElement === this.document.body) return;
    this.mascara = mascara;
    this.document.body.appendChild(mascara);
  }
}
